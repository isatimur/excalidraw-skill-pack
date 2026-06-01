from __future__ import annotations

import argparse
import sys
from pathlib import Path

from excalidraw_render.render import render_to_png


def main() -> int:
    parser = argparse.ArgumentParser(description="Render Excalidraw JSON to PNG")
    parser.add_argument("input", type=Path, help="Path to .excalidraw JSON file")
    parser.add_argument(
        "--theme", default="default-sketchy", help="Theme name (default: default-sketchy)"
    )
    parser.add_argument(
        "--output", "-o", type=Path, default=None, help="Output PNG path (default: input with .png)"
    )
    parser.add_argument("--scale", type=int, default=2, help="Device scale factor (default: 2)")
    parser.add_argument(
        "--width", type=int, default=1920, help="Max viewport width (default: 1920)"
    )
    args = parser.parse_args()

    if not args.input.exists():
        print(f"ERROR: File not found: {args.input}", file=sys.stderr)
        return 1

    output = args.output if args.output is not None else args.input.with_suffix(".png")
    json_str = args.input.read_text(encoding="utf-8")
    png_bytes = render_to_png(json_str, theme=args.theme, scale=args.scale, width=args.width)
    output.write_bytes(png_bytes)
    print(str(output))
    return 0
