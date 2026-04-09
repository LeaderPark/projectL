@echo off
setlocal

cd /d "%~dp0"

powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File ".\scripts\deploy.ps1"
set "EXIT_CODE=%ERRORLEVEL%"

if "%EXIT_CODE%"=="0" (
  echo [deploy] Deployment finished successfully.
) else (
  echo [deploy] Deployment failed with exit code %EXIT_CODE%.
)

set /p _="배포 로그를 확인했으면 Enter를 눌러 창을 닫으세요: "
exit /b %EXIT_CODE%
