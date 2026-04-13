@echo off
setlocal

cd /d "%~dp0"

echo [deploy] Running scripts\deploy.ps1...
powershell -ExecutionPolicy Bypass -File ".\scripts\deploy.ps1"
set "EXIT_CODE=%ERRORLEVEL%"

if "%EXIT_CODE%"=="0" (
  echo [deploy] Deployment finished successfully.
) else (
  echo [deploy] Deployment failed with exit code %EXIT_CODE%.
)

set /p _="Press Enter to close this window after reviewing the deploy log: "
exit /b %EXIT_CODE%
