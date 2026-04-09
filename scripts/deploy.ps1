Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Require-Command {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' was not found in PATH."
  }
}

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Label,
    [Parameter(Mandatory = $true)]
    [scriptblock]$Action
  )

  Write-Host "[deploy] $Label"
  & $Action

  if ($LASTEXITCODE -ne 0) {
    throw "$Label failed with exit code $LASTEXITCODE"
  }
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot ".env"

Set-Location $projectRoot

Write-Host "[deploy] Starting deployment from $projectRoot"

Require-Command -Name "git"
Require-Command -Name "docker"

if (-not (Test-Path $envPath)) {
  throw "Missing .env file. Create it first or run .\scripts\bootstrap.ps1."
}

$envText = Get-Content -Raw $envPath
if ($envText -match "__CHANGE_ME__") {
  throw ".env still contains __CHANGE_ME__ placeholders. Fill in real values before deploying."
}

$gitStatus = git status --porcelain
if ($LASTEXITCODE -ne 0) {
  throw "git status failed with exit code $LASTEXITCODE"
}

if ($gitStatus) {
  throw "Working tree has local changes. Commit or stash them before running deploy."
}

Invoke-Step -Label "Pulling the latest changes" -Action {
  git pull --ff-only
}

Invoke-Step -Label "Validating docker compose configuration" -Action {
  docker compose --env-file $envPath config *> $null
}

Invoke-Step -Label "Stopping the current compose stack" -Action {
  docker compose down
}

Invoke-Step -Label "Starting the updated compose stack" -Action {
  docker compose up -d --build
}

Write-Host "[deploy] Checking service status"
$composeStatus = docker compose ps
if ($LASTEXITCODE -ne 0) {
  throw "docker compose ps failed with exit code $LASTEXITCODE"
}

Write-Host $composeStatus

$expectedServices = @(docker compose --env-file $envPath config --services)
if ($LASTEXITCODE -ne 0) {
  throw "docker compose config --services failed with exit code $LASTEXITCODE"
}

$runningServices = @(docker compose ps --services --filter status=running)
if ($LASTEXITCODE -ne 0) {
  throw "docker compose ps --services failed with exit code $LASTEXITCODE"
}

$missingServices = @(
  $expectedServices | Where-Object { $_ -and ($_ -notin $runningServices) }
)

if ($missingServices.Count -gt 0) {
  throw "Some services are not running after deploy: $($missingServices -join ', ')"
}

if ($composeStatus -match "unhealthy|dead|exited") {
  throw "Compose stack reported an unhealthy or stopped container."
}

Write-Host "[deploy] Deployment completed successfully."
