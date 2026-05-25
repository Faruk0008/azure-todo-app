@echo off
echo ===================================================
echo   Automated GitHub Push Script
echo ===================================================
echo.

:: Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in your system PATH.
    echo Please install Git from https://git-scm.com/ and try again.
    pause
    exit /b
)

:: Initialize git if not already
if not exist ".git" (
    echo [*] Initializing Git repository...
    git init
)

echo [*] Staging all project files...
git add .

echo [*] Committing files...
git commit -m "Initial commit from Azure Project CA2"

echo [*] Setting default branch to 'main'...
git branch -M main

:: Try to use GitHub CLI if installed (it automates everything)
where gh >nul 2>nul
if %errorlevel% equ 0 (
    echo [*] GitHub CLI detected! Attempting automatic repository creation...
    gh repo create azure-todo-app --public --source=. --remote=origin --push
    if %errorlevel% equ 0 (
        echo.
        echo [SUCCESS] Project successfully created and pushed to GitHub!
        pause
        exit /b
    ) else (
        echo [!] GitHub CLI failed or was cancelled. Falling back to manual URL input...
        echo.
    )
)

:: Fallback if gh CLI is not installed or fails
echo [NOTICE] GitHub CLI not found or failed. We need the URL of an empty repository.
echo Please create an empty repository on GitHub (without a README) and paste the URL here.
echo.
set /p REPO_URL="Enter your GitHub repository URL (e.g., https://github.com/Username/Repo.git): "

if "%REPO_URL%"=="" (
    echo [ERROR] No URL was provided. Aborting.
    pause
    exit /b
)

:: Remove existing origin if there is one, to avoid errors
git remote remove origin 2>nul
echo [*] Linking to remote repository...
git remote add origin %REPO_URL%

echo [*] Pushing code to GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Project successfully pushed to GitHub!
) else (
    echo.
    echo [ERROR] Failed to push to GitHub. Please check if the URL is correct and you have access.
)

pause
