from __future__ import annotations

import importlib.resources
import json
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from playwright.sync_api import Browser, Playwright


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


def _viewport_for(json_str: str, width: int) -> tuple[int, int]:
    data = json.loads(json_str)
    elements = [e for e in data.get("elements", []) if not e.get("isDeleted")]
    min_x, min_y, max_x, max_y = _compute_bounding_box(elements)
    padding = 80
    vp_w = min(int(max_x - min_x + padding * 2), width)
    vp_h = max(int(max_y - min_y + padding * 2), 600)
    return vp_w, vp_h


def _template_uri() -> str:
    ref = importlib.resources.files("excalidraw_render").joinpath("render_template.html")
    with importlib.resources.as_file(ref) as template_path:
        return Path(template_path).as_uri()


@dataclass
class BatchItem:
    json: str
    theme: str = "default-sketchy"
    scale: int = 2
    width: int = 1200


class Renderer:
    """Owns a single headless Chromium instance and reuses it across renders.

    Launching the browser dominates render cost; each diagram still gets its own
    page sized to its bounding box, so output is identical to a one-shot render.
    Call ``close()`` when done, or use it as a context manager. ``render_to_png``
    and ``render_many`` manage the lifecycle for you.
    """

    def __init__(self) -> None:
        self._pw: Playwright | None = None
        self._browser: Browser | None = None

    def _ensure_browser(self) -> Browser:
        if self._browser is None:
            from playwright.sync_api import sync_playwright

            self._pw = sync_playwright().start()
            self._browser = self._pw.chromium.launch(headless=True)
        return self._browser

    def render(
        self,
        json_str: str,
        *,
        theme: str = "default-sketchy",
        scale: int = 2,
        width: int = 1200,
    ) -> bytes:
        vp_w, vp_h = _viewport_for(json_str, width)
        browser = self._ensure_browser()
        page = browser.new_page(viewport={"width": vp_w, "height": vp_h}, device_scale_factor=scale)
        try:
            page.goto(_template_uri())
            # Wait for the ES module to load (imports from esm.sh)
            page.wait_for_function("window.__moduleReady === true", timeout=30000)
            result = page.evaluate(f"window.renderDiagram({json_str})")
            if not result or not result.get("success"):
                error_msg = (
                    result.get("error", "Unknown render error")
                    if result
                    else "renderDiagram returned null"
                )
                raise RuntimeError(f"Render failed: {error_msg}")
            page.wait_for_function("window.__renderComplete === true", timeout=15000)
            svg_el = page.query_selector("#root svg")
            if svg_el is None:
                raise RuntimeError("No SVG element found after render")
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                tmp_path = Path(tmp.name)
            svg_el.screenshot(path=str(tmp_path))
            png_bytes = tmp_path.read_bytes()
            tmp_path.unlink(missing_ok=True)
            return png_bytes
        finally:
            page.close()

    def close(self) -> None:
        if self._browser is not None:
            self._browser.close()
            self._browser = None
        if self._pw is not None:
            self._pw.stop()
            self._pw = None

    def __enter__(self) -> Renderer:
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()


def render_to_png(json_str: str, *, theme: str, scale: int, width: int) -> bytes:
    with Renderer() as renderer:
        return renderer.render(json_str, theme=theme, scale=scale, width=width)


def render_many(items: list[BatchItem]) -> list[bytes]:
    """Render many diagrams reusing one browser. The expensive Chromium launch
    happens once instead of once per diagram. Results are returned in input order.
    """
    with Renderer() as renderer:
        return [
            renderer.render(item.json, theme=item.theme, scale=item.scale, width=item.width)
            for item in items
        ]
