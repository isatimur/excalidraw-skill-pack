param([string]$Mode = "full", [string]$Theme = "default-sketchy")

try { $CorePkgPath = node -e "console.log(require.resolve('@excalidraw-skill-pack/core/package.json'))" 2>$null } catch {}
if (-not $CorePkgPath) {
  npm install -g "@excalidraw-skill-pack/core"
  $CorePkgPath = node -e "console.log(require.resolve('@excalidraw-skill-pack/core/package.json'))"
}
$CoreDir = Split-Path $CorePkgPath

New-Item -ItemType Directory -Force -Path ".cursor\rules" | Out-Null

$Skill = Get-Content "$CoreDir\SKILL.md" -Raw
$PalettePath = "$CoreDir\themes\$Theme\palette.md"
if (Test-Path $PalettePath) {
  $Palette = Get-Content $PalettePath -Raw
} else {
  $Palette = Get-Content "$CoreDir\themes\default-sketchy\palette.md" -Raw
}

$Template = Get-Content "$PSScriptRoot\rules.mdc.template" -Raw
$Out = $Template.Replace("{{SKILL_BODY}}", $Skill).Replace("{{PALETTE_MD}}", $Palette)
Set-Content ".cursor\rules\excalidraw.mdc" $Out

Write-Output "Installed Cursor rule at .cursor\rules\excalidraw.mdc"

if ($Mode -eq "full") {
  $McpConfig = ".cursor\mcp.json"
  if (-not (Test-Path $McpConfig)) { '{ "mcpServers": {} }' | Set-Content $McpConfig }
  $cfg = Get-Content $McpConfig -Raw | ConvertFrom-Json
  if (-not $cfg.mcpServers) { $cfg | Add-Member -NotePropertyName mcpServers -NotePropertyValue (@{}) }
  $cfg.mcpServers.'excalidraw-skill-pack' = @{ command = "npx"; args = @("@excalidraw-skill-pack/mcp-server") }
  $cfg | ConvertTo-Json -Depth 10 | Set-Content $McpConfig
  Write-Output "Registered MCP server in $McpConfig"
}

Write-Output "Done."
