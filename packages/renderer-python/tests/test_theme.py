from pathlib import Path

import pytest
from excalidraw_render.theme import ResolvedTheme, resolve_theme

REPO_ROOT = Path(__file__).resolve().parents[3]
CORE_THEMES = REPO_ROOT / "packages" / "core" / "themes"


def test_resolve_default_sketchy():
    t = resolve_theme("default-sketchy", themes_dir=CORE_THEMES)
    assert isinstance(t, ResolvedTheme)
    assert t.manifest["name"] == "default-sketchy"
    assert t.palette["ink"] == "#1e1e1e"


def test_unknown_theme_raises():
    with pytest.raises(LookupError, match="not found"):
        resolve_theme("nope", themes_dir=CORE_THEMES)
