from pathlib import Path

import pytest
from PIL import Image

from excalidraw_render.render import render_to_png

REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURES = REPO_ROOT / "packages" / "shared" / "fixtures"
GOLDENS = FIXTURES / "golden"

FIXTURE_NAMES = [
    "01-flow-pipeline",
    "02-layered-stack",
    "03-concept-card",
    "04-relationship-map",
    "05-inline-figure",
]


@pytest.mark.parametrize("name", FIXTURE_NAMES)
def test_canary_matches_golden(name: str):
    json_str = (FIXTURES / f"{name}.excalidraw").read_text(encoding="utf-8")
    png_bytes = render_to_png(json_str, theme="default-sketchy", scale=1, width=800)

    actual = Image.open(__import__("io").BytesIO(png_bytes)).convert("RGBA")
    golden = Image.open(GOLDENS / f"{name}.python.png").convert("RGBA")

    assert actual.size == golden.size, f"Size mismatch: {actual.size} vs {golden.size}"

    import pixelmatch
    from pixelmatch.contrib.PIL import pixelmatch as pm

    total_pixels = actual.width * actual.height
    mismatch = pm(actual, golden, None, threshold=0.1)
    ratio = mismatch / total_pixels
    assert ratio <= 0.02, f"{name}: pixel mismatch {ratio:.1%} > 2% tolerance ({mismatch}/{total_pixels} pixels)"
