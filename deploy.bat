@echo off
setlocal

cd /d "%~dp0"

echo [deploy] Rebuilding and restarting Docker Compose services...
docker compose down
if errorlevel 1 goto :failed

docker compose up -d --build
set "EXIT_CODE=%ERRORLEVEL%"

if "%EXIT_CODE%"=="0" (
  echo [deploy] Docker rebuild and restart finished successfully.
) else (
  echo [deploy] Deployment failed with exit code %EXIT_CODE%.
)

set /p _="Press Enter to close this window after reviewing the deploy log: "
exit /b %EXIT_CODE%

:failed
set "EXIT_CODE=%ERRORLEVEL%"
echo [deploy] Deployment failed with exit code %EXIT_CODE%.
set /p _="Press Enter to close this window after reviewing the deploy log: "
exit /b %EXIT_CODE%
