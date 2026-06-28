---
"@excalidraw-skill-pack/mcp-server": patch
---

Sync the MCP server's self-reported version. The `Server()` identity hardcoded `0.1.2` while `package.json`, `server.json`, and the published npm package were all `0.1.3`, so the running container (and any Glama release built from it) advertised a stale version.
