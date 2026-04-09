Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot ".env"

Set-Location $projectRoot

if (-not (Test-Path $envPath)) {
  throw "Missing .env file. Create it first or run .\scripts\bootstrap.ps1."
}

$envMap = @{}
foreach ($line in Get-Content $envPath) {
  if ([string]::IsNullOrWhiteSpace($line) -or $line.TrimStart().StartsWith("#")) {
    continue
  }

  $parts = $line -split "=", 2
  if ($parts.Count -eq 2) {
    $envMap[$parts[0].Trim()] = $parts[1].Trim()
  }
}

$token = $envMap["CF_TUNNEL_TOKEN"]
if ([string]::IsNullOrWhiteSpace($token) -or $token -eq "__CHANGE_ME__") {
  throw "CF_TUNNEL_TOKEN is empty. Create a Cloudflare Tunnel and paste its token into .env first."
}

docker compose --profile cloudflare up -d cloudflared
if ($LASTEXITCODE -ne 0) {
  throw "Failed to start cloudflared."
}

$hostname = $envMap["CF_PUBLIC_HOSTNAME"]
if ([string]::IsNullOrWhiteSpace($hostname)) {
  Write-Host "cloudflared is starting with the token stored in .env"
} else {
  Write-Host "cloudflared is starting for https://$hostname"
}
