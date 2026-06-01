from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


@dataclass
class ResolvedTheme:
    manifest: dict
    palette: dict
    typography: dict
    elements: dict
    layouts: dict
    palette_markdown: str


def _load_one(theme_dir: Path) -> dict:
    manifest = json.loads((theme_dir / "theme.json").read_text(encoding="utf-8"))
    try:
        palette = json.loads((theme_dir / "palette.json").read_text(encoding="utf-8"))
    except FileNotFoundError:
        palette = {}
    try:
        typography = json.loads((theme_dir / "typography.json").read_text(encoding="utf-8"))
    except FileNotFoundError:
        typography = {}
    elements: dict = {}
    elements_dir = theme_dir / "elements"
    if elements_dir.is_dir():
        for f in elements_dir.iterdir():
            if f.suffix == ".json":
                elements[f.stem] = json.loads(f.read_text(encoding="utf-8"))
    layouts: dict = {}
    layouts_dir = theme_dir / "layouts"
    if layouts_dir.is_dir():
        for f in layouts_dir.iterdir():
            if f.suffix == ".md":
                layouts[f.stem] = f.read_text(encoding="utf-8")
    try:
        palette_markdown = (theme_dir / "palette.md").read_text(encoding="utf-8")
    except FileNotFoundError:
        palette_markdown = ""
    return {
        "manifest": manifest,
        "palette": palette,
        "typography": typography,
        "elements": elements,
        "layouts": layouts,
        "palette_markdown": palette_markdown,
    }


def _merge(parent: dict, child: dict) -> dict:
    return {
        "manifest": child.get("manifest") or parent.get("manifest"),
        "palette": {**parent.get("palette", {}), **child.get("palette", {})},
        "typography": child.get("typography") or parent.get("typography"),
        "elements": {**parent.get("elements", {}), **child.get("elements", {})},
        "layouts": {**parent.get("layouts", {}), **child.get("layouts", {})},
        "palette_markdown": child.get("palette_markdown") or parent.get("palette_markdown") or "",
    }


def resolve_theme(name: str, *, themes_dir: Path) -> ResolvedTheme:
    theme_dir = themes_dir / name
    if not (theme_dir / "theme.json").exists():
        raise LookupError(f"Theme '{name}' not found at {theme_dir}")
    resolved = _load_one(theme_dir)
    seen: set[str] = {name}
    while resolved["manifest"].get("extends"):
        parent_name = resolved["manifest"]["extends"]
        if parent_name in seen:
            raise ValueError(f"Theme inheritance cycle at {parent_name}")
        seen.add(parent_name)
        parent_dir = themes_dir / parent_name
        parent = _load_one(parent_dir)
        child_manifest = {**resolved["manifest"]}
        del child_manifest["extends"]
        resolved["manifest"] = child_manifest
        resolved = _merge(parent, resolved)
    return ResolvedTheme(
        manifest=resolved["manifest"],
        palette=resolved["palette"],
        typography=resolved["typography"],
        elements=resolved["elements"],
        layouts=resolved["layouts"],
        palette_markdown=resolved["palette_markdown"],
    )
