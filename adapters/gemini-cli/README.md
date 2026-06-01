# Gemini CLI adapter

Installs the excalidraw-skill-pack extension at `~/.gemini/extensions/excalidraw-skill-pack/extension.json`.

```bash
bash adapters/gemini-cli/install.sh       # full (context files + MCP)
bash adapters/gemini-cli/install.sh lite  # context files only, no MCP
```

Windows:

```powershell
.\adapters\gemini-cli\install.ps1
.\adapters\gemini-cli\install.ps1 -Mode lite
```

The extension manifest references `SKILL.md` and `element-templates.md` from the installed core package. Gemini CLI picks up extensions in `~/.gemini/extensions/` automatically on next launch.
