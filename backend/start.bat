@echo off
REM AIPhoto Backend Server Startup Script (Windows)

echo ========================================
echo AIPhoto Backend Server
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo Virtual environment created
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo.
echo Installing dependencies...
pip install -r requirements.txt

REM Create data directory if not exists
if not exist "data" mkdir data

REM Start server
echo.
echo ========================================
echo Starting server at http://localhost:8000
echo Press Ctrl+C to stop the server
echo ========================================
echo.
echo Default Admin Credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo ========================================
echo.

python main.py
