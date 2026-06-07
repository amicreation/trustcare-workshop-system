@echo off
title Trust Care Workshop Management System
echo =========================================================
echo  TRUST CARE WORKSHOP MANAGEMENT SYSTEM
echo =========================================================
echo.
echo Starting backend server in the background...
echo Please DO NOT close this command window.
echo.

:: Start Laravel serving through the local PHP batch wrapper
start /b bin\php.bat backend/artisan serve --port=8000

:: Wait 3 seconds for the server to spin up
timeout /t 3 /nobreak >nul

:: Open browser
start http://127.0.0.1:8000

echo.
echo ---------------------------------------------------------
echo  System is running locally at http://127.0.0.1:8000
echo  Default Credentials:
echo    Admin: admin / admin123
echo    Advisor: advisor / advisor123
echo    Manager: manager / manager123
echo ---------------------------------------------------------
echo.
echo Close this command window to stop the servers.
echo.

:: Keep script alive in loop
:loop
timeout /t 10 >nul
goto loop
