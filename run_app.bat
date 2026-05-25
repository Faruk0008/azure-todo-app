@echo off
echo ===================================================
echo   Azure To-Do App Runner
echo ===================================================
echo.

:: Check if Node is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not in your system PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

echo [*] Installing dependencies...
call npm install

echo.
echo [*] Starting the application...
call npm start

pause
