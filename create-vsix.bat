@echo off
REM Batch file to create VSIX package for VS Code extension

echo ========================================
echo Building VS Code Extension VSIX Package
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

REM Compile TypeScript
echo Compiling TypeScript...
call npm run compile
if errorlevel 1 (
    echo ERROR: Compilation failed
    pause
    exit /b 1
)
echo Compilation successful!
echo.

REM Check if vsce is installed globally
echo Checking for vsce (Visual Studio Code Extension Manager)...
call vsce --version >nul 2>&1
if errorlevel 1 (
    echo vsce not found. Installing @vscode/vsce globally...
    call npm install -g @vscode/vsce
    if errorlevel 1 (
        echo ERROR: Failed to install vsce
        pause
        exit /b 1
    )
    echo.
)

REM Package the extension
echo Creating VSIX package...
call vsce package
if errorlevel 1 (
    echo ERROR: Failed to create VSIX package
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! VSIX package created
echo ========================================
echo.
echo Your extension package is ready to install or publish.
echo To install locally: code --install-extension local-llm-chat-1.0.0.vsix
echo.

pause
