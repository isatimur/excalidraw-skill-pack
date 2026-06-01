"""excalidraw-skill-pack-theme-notion: theme package.

This package ships the same files as the npm @excalidraw-skill-pack/theme-notion
package. The Python renderer discovers it via importlib.resources at runtime.
"""

from importlib.resources import files

__version__ = "0.1.0"
THEME_DIR = files(__package__)
