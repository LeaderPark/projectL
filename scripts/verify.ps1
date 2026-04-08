Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot ".env"
$envExamplePath = Join-Path $projectRoot ".env.example"

Set-Location $projectRoot

node --test tests/*.test.js
if ($LASTEXITCODE -ne 0) {
  throw "node tests failed with exit code $LASTEXITCODE"
}

$composeEnvPath = if (Test-Path $envPath) { $envPath } else { $envExamplePath }

docker compose --env-file $composeEnvPath config *> $null
if ($LASTEXITCODE -ne 0) {
  throw "docker compose config failed with exit code $LASTEXITCODE"
}

Write-Host "[verify] Tests passed and compose file is valid."
