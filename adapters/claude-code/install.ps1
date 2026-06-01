param([string]$Mode = "full")

$Target = "$env:USERPROFILE\.claude\skills\excalidraw-diagram"

try { $CorePkgPath = node -e "console.log(require.resolve('@excalidraw-skill-pack/core/package.json'))" 2>$null } catch {}
if (-not $CorePkgPath) {
  Write-Output "Installing @excalidraw-skill-pack/core globally..."
  npm install -g "@excalidraw-skill-pack/core"
  $CorePkgPath = node -e "console.log(require.resolve('@excalidraw-skill-pack/core/package.json'))"
}
$CoreDir = Split-Path $CorePkgPath

New-Item -ItemType Directory -Force -Path "$Target\references" | Out-Null
Copy-Item "$CoreDir\SKILL.md" "$Target\SKILL.md"
Copy-Item -Recurse -Force "$CoreDir\themes" "$Target\themes"
Copy-Item "$CoreDir\element-templates.md" "$Target\references\"
Copy-Item "$CoreDir\json-schema.md" "$Target\references\"

Write-Output "Installed Claude Code skill at $Target"

if ($Mode -eq "full") {
  $McpConfig = "$env:USERPROFILE\.claude\mcp.json"
  New-Item -ItemType Directory -Force -Path (Split-Path $McpConfig) | Out-Null
  if (-not (Test-Path $McpConfig)) { '{ "mcpServers": {} }' | Set-Content $McpConfig }
  $cfg = Get-Content $McpConfig -Raw | ConvertFrom-Json
  if (-not $cfg.mcpServers) { $cfg | Add-Member -NotePropertyName mcpServers -NotePropertyValue (@{}) }
  $cfg.mcpServers.'excalidraw-skill-pack' = @{ command = "npx"; args = @("@excalidraw-skill-pack/mcp-server") }
  $cfg | ConvertTo-Json -Depth 10 | Set-Content $McpConfig
  Write-Output "Registered MCP server in $McpConfig"
}

Write-Output "Done."
