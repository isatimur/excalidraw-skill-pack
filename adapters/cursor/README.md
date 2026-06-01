# Cursor adapter

Installs `.cursor/rules/excalidraw.mdc` + (full mode) registers the MCP server in `.cursor/mcp.json`.

Run from the root of your project:

```bash
bash adapters/cursor/install.sh                  # full
bash adapters/cursor/install.sh lite             # rules only
THEME=stripe-press bash adapters/cursor/install.sh
```

Windows:

```powershell
.\adapters\cursor\install.ps1
.\adapters\cursor\install.ps1 -Mode lite
.\adapters\cursor\install.ps1 -Theme stripe-press
```

The MDC rule is written to `.cursor/rules/excalidraw.mdc` in the current working directory and is picked up by Cursor automatically for files matching `*.excalidraw`.
