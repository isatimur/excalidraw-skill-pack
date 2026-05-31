from io import BytesIO
from pathlib import Path

from PIL import Image

from excalidraw_render.render import render_to_png

REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE = REPO_ROOT / "packages" / "shared" / "fixtures" / "05-inline-figure.excalidraw"


def test_render_to_png_produces_image_bytes():
    json_str = FIXTURE.read_text(encoding="utf-8")
    png = render_to_png(json_str, theme="default-sketchy", scale=1, width=800)
    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    img = Image.open(BytesIO(png))
    assert img.width > 100
    assert img.height > 100
