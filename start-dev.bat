@echo off
REM BPMETER Development Startup Script for Windows
REM Inicia backend (Python) y frontend (Next.js) simultáneamente

echo ====================================
echo 🎵 BPMETER - Starting Dev Environment
echo ====================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python no está instalado
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado
    pause
    exit /b 1
)

echo 📦 Checking dependencies...
echo.

REM Setup backend if needed
if not exist "backend\venv" (
    echo 🔧 Setting up Python backend...
    cd backend
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
    cd ..
)

REM Install frontend dependencies if needed
if not exist "frontend\node_modules" (
    echo 🔧 Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo ✅ Dependencies ready
echo.
echo 🚀 Starting services...
echo.

REM Start backend in new window
echo [Backend] Starting Python server...
start "BPMETER Backend" cmd /k "cd backend && venv\Scripts\activate && python server.py"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
echo [Frontend] Starting Next.js...
start "BPMETER Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ====================================
echo 🎉 BPMETER is running!
echo ====================================
echo.
echo 📱 Frontend: http://localhost:3000
echo 🐍 Backend:  http://localhost:5000
echo.
echo Check the opened windows for logs
echo Close both windows to stop services
echo.
pause

