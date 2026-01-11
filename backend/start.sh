#!/bin/bash
# AIPhoto Backend Server Startup Script (Linux/Mac)

set -e

echo "========================================"
echo "AIPhoto Backend Server"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python is not installed"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "Virtual environment created"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo ""
echo "Installing dependencies..."
pip install -r requirements.txt

# Create data directory if not exists
mkdir -p data

# Start server
echo ""
echo "========================================"
echo "Starting server at http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo ""
echo "Default Admin Credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "========================================"
echo ""

python main.py
