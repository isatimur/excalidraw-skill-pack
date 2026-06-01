from __future__ import annotations

import importlib.resources
import json
import tempfile
from pathlib import Path


def _compute_bounding_box(elements: list[dict]) -> tuple[float, float, float, float]:
    min_x = float("inf")
    min_y = float("inf")
    max_x = float("-inf")
    max_y = float("-inf")

    for el in elements:
        if el.get("isDeleted"):
            continue
        x = el.get("x", 0)
        y = el.get("y", 0)
        w = el.get("width", 0)
        h = el.get("height", 0)

        if el.get("type") in ("arrow", "line") and "points" in el:
            for px, py in el["points"]:
                min_x = min(min_x, x + px)
                min_y = min(min_y, y + py)
                max_x = max(max_x, x + px)
                max_y = max(max_y, y + py)
        else:
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x + abs(w))
            max_y = max(max_y, y + abs(h))

    if min_x == float("inf"):
        return (0, 0, 800, 600)

    return (min_x, min_y, max_x, max_y)


def render_to_png(json_str: str, *, theme: str, scale: int, width: int) -> bytes:
    from playwright.sync_api import sync_playwright

    data = json.loads(json_str)
    elements = [e for e in data.get("elements", []) if not e.get("isDeleted")]
    min_x, min_y, max_x, max_y = _compute_bounding_box(elements)
    padding = 80
    vp_w = min(int(max_x - min_x + padding * 2), width)
    vp_h = max(int(max_y - min_y + padding * 2), 600)

    ref = importlib.resources.files("excalidraw_render").joinpath("render_template.html")
    with importlib.resources.as_file(ref) as template_path:
        template_url = Path(template_path).as_uri()
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(
                viewport={"width": vp_w, "height": vp_h},
                device_scale_factor=scale,
            )
            page.goto(template_url)
            # Wait for the ES module to load (imports from esm.sh)
            page.wait_for_function("window.__moduleReady === true", timeout=30000)
            result = page.evaluate(f"window.renderDiagram({json_str})")
            if not result or not result.get("success"):
                error_msg = (
                    result.get("error", "Unknown render error")
                    if result
                    else "renderDiagram returned null"
                )
                browser.close()
                raise RuntimeError(f"Render failed: {error_msg}")
            page.wait_for_function("window.__renderComplete === true", timeout=15000)
            svg_el = page.query_selector("#root svg")
            if svg_el is None:
                browser.close()
                raise RuntimeError("No SVG element found after render")
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                tmp_path = Path(tmp.name)
            svg_el.screenshot(path=str(tmp_path))
            png_bytes = tmp_path.read_bytes()
            tmp_path.unlink(missing_ok=True)
            browser.close()
            return png_bytes
