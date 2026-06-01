import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE = REPO_ROOT / "packages" / "shared" / "fixtures" / "05-inline-figure.excalidraw"


def test_cli_renders_to_output_path(tmp_path):
    out = tmp_path / "out.png"
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "excalidraw_render",
            str(FIXTURE),
            "--theme",
            "default-sketchy",
            "--output",
            str(out),
            "--scale",
            "1",
            "--width",
            "800",
        ],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr
    assert out.exists()
    assert out.stat().st_size > 5000
