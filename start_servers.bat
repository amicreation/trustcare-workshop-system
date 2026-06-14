@echo off
echo ===================================================
echo   Starting Trust Care Workshop Management System
echo ===================================================
echo.
cd /d "E:\Codes\trustcare\trustcare"

echo Cleaning up any existing server processes on ports 8000 and 5173...
powershell -NoProfile -Command "$ports = Get-NetTCPConnection -LocalPort 8000, 5173 -ErrorAction SilentlyContinue; if ($ports) { Stop-Process -Id $ports.OwningProcess -Force -ErrorAction SilentlyContinue }; $true"

echo [1/2] Opening application in your browser...
start "" "http://127.0.0.1:8000"

echo [2/2] Launching Backend and Frontend Dev Servers concurrently...
echo.
npx concurrently --kill-others "php artisan serve" "npm run dev"
