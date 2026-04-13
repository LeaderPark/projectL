Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot ".env"
$examplePath = Join-Path $projectRoot ".env.example"

Set-Location $projectRoot

if (-not (Test-Path $envPath)) {
  Copy-Item $examplePath $envPath
  Write-Host "[bootstrap] .env 파일이 없어 .env.example을 복사했습니다."
  Write-Host "[bootstrap] .env 의 Discord/Riot/DB 비밀값을 채운 뒤 다시 실행하세요."
  exit 0
}

$envText = Get-Content -Raw $envPath
if ($envText -match "__CHANGE_ME__") {
  Write-Host "[bootstrap] .env 에 아직 __CHANGE_ME__ 값이 남아 있습니다."
  Write-Host "[bootstrap] 실제 Discord/Riot/DB 비밀값으로 수정한 뒤 다시 실행하세요."
  exit 1
}

docker compose up -d --build

if ($LASTEXITCODE -ne 0) {
  throw "docker compose up failed with exit code $LASTEXITCODE"
}

& (Join-Path $PSScriptRoot "sync-commands.ps1")
if ($LASTEXITCODE -ne 0) {
  throw "slash command sync failed with exit code $LASTEXITCODE"
}

Write-Host "[bootstrap] Compose stack started."
Write-Host "[bootstrap] DB host: localhost"
Write-Host "[bootstrap] DB port: $(Select-String -Path $envPath -Pattern '^DB_PUBLIC_PORT=' | ForEach-Object { $_.Line.Split('=')[1] })"
