from io import BytesIO
from pathlib import Path

from excalidraw_render.render import BatchItem, render_many, render_to_png
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE = REPO_ROOT / "packages" / "shared" / "fixtures" / "05-inline-figure.excalidraw"


def test_render_to_png_produces_image_bytes():
    json_str = FIXTURE.read_text(encoding="utf-8")
    png = render_to_png(json_str, theme="default-sketchy", scale=1, width=800)
    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    img = Image.open(BytesIO(png))
    assert img.width > 100
    assert img.height > 100


def test_render_many_reuses_one_browser_and_matches_one_shot():
    json_str = FIXTURE.read_text(encoding="utf-8")
    pngs = render_many(
        [
            BatchItem(json=json_str, theme="default-sketchy", scale=1, width=800),
            BatchItem(json=json_str, theme="default-sketchy", scale=1, width=800),
        ]
    )
    assert len(pngs) == 2
    single = Image.open(
        BytesIO(render_to_png(json_str, theme="default-sketchy", scale=1, width=800))
    )
    for png in pngs:
        assert png[:8] == b"\x89PNG\r\n\x1a\n"
        # The batch path must produce the same geometry as the one-shot render.
        assert Image.open(BytesIO(png)).size == single.size
