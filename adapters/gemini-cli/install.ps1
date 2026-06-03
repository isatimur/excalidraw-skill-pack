param([string]$Mode = "full")

$Target = "$env:USERPROFILE\.gemini\extensions\excalidraw-skill-pack"

if ($env:ESP_CORE_DIR -and (Test-Path "$env:ESP_CORE_DIR/SKILL.md")) {
  $CoreDir = $env:ESP_CORE_DIR
} else {
  try { $CorePkgPath = node -e "console.log(require.resolve('@excalidraw-skill-pack/core/package.json'))" 2>$null } catch {}
if (-not $CorePkgPath) {
  Write-Output "Installing @excalidraw-skill-pack/core globally..."
  npm install -g "@excalidraw-skill-pack/core"
  $CorePkgPath = node -e "console.log(require.resolve('@excalidraw-skill-pack/core/package.json'))"
}
$CoreDir = Split-Path $CorePkgPath
}

New-Item -ItemType Directory -Force -Path $Target | Out-Null

$Template = Get-Content "$PSScriptRoot\extension.json.template" -Raw
$Out = $Template.Replace("{{CORE_DIR}}", $CoreDir.Replace("\", "/"))
$ExtPath = Join-Path $Target "extension.json"
Set-Content $ExtPath $Out

if ($Mode -eq "lite") {
  $cfg = Get-Content $ExtPath -Raw | ConvertFrom-Json
  $cfg.PSObject.Properties.Remove("mcpServers")
  $cfg | ConvertTo-Json -Depth 10 | Set-Content $ExtPath
}

Write-Output "Installed Gemini CLI extension at $Target"
Write-Output "Done."
