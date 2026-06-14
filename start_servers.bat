@echo off
echo ===================================================
echo   Starting Trust Care Workshop Management System
echo ===================================================
echo.
cd /d "E:\Codes\trustcare\trustcare"

echo [1/2] Opening application in your browser...
start "" "http://127.0.0.1:8000"

echo [2/2] Launching Backend and Frontend Dev Servers concurrently...
echo.
npx concurrently --kill-others "php artisan serve" "npm run dev"
