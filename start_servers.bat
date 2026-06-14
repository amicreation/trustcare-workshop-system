@echo off
echo ===================================================
echo   Starting Trust Care Workshop Management System
echo ===================================================
echo.
cd /d "E:\Codes\trustcare\trustcare"

echo [1/3] Starting Laravel Backend Server...
start "TrustCare Backend" cmd /k "php artisan serve"

echo [2/3] Starting Vite Frontend Server...
start "TrustCare Frontend" cmd /k "npm run dev"

echo [3/3] Opening application in your browser...
timeout /t 3 /nobreak > nul
start "" "http://127.0.0.1:8000"

echo.
echo Servers started successfully! Feel free to close this window.
timeout /t 2 /nobreak > nul
exit
