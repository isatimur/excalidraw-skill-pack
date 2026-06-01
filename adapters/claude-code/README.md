# Claude Code adapter

```bash
bash adapters/claude-code/install.sh       # full (skill + MCP)
bash adapters/claude-code/install.sh lite  # skill only, no MCP
```

Windows:

```powershell
.\adapters\claude-code\install.ps1
.\adapters\claude-code\install.ps1 -Mode lite
```

After install, the skill auto-loads in Claude Code on next session from `~/.claude/skills/excalidraw-diagram/`.
