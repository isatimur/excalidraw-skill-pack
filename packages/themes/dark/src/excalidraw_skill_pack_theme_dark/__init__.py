"""excalidraw-skill-pack-theme-dark: theme package.

This package ships the same files as the npm @excalidraw-skill-pack/theme-dark
package. The Python renderer discovers it via importlib.resources at runtime.
"""

from importlib.resources import files

__version__ = "0.1.0"
THEME_DIR = files(__package__)
