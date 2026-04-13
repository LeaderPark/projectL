Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot ".env"

Set-Location $projectRoot

if (-not (Test-Path $envPath)) {
  throw "Missing .env file. Create it first or run .\scripts\bootstrap.ps1."
}

$runningServices = @(docker compose ps --services --filter status=running)
if ($LASTEXITCODE -ne 0) {
  throw "Failed to read compose service status."
}

if ("bot" -notin $runningServices) {
  throw "The bot service is not running, so slash commands cannot be refreshed yet."
}

docker compose exec -T bot node deploy-commands.js
if ($LASTEXITCODE -ne 0) {
  throw "Failed to refresh slash commands."
}

Write-Host "[sync-commands] Slash commands refreshed."
