#!/bin/bash

# BPMETER Development Startup Script
# Inicia backend (Python) y frontend (Next.js) simultáneamente

echo "🎵 BPMETER - Starting Development Environment"
echo "=============================================="

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 no está instalado${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📦 Checking dependencies...${NC}"

# Check backend dependencies
if [ ! -d "backend/venv" ]; then
    echo -e "${YELLOW}🔧 Setting up Python backend...${NC}"
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip > /dev/null 2>&1
    echo "Installing Flask and basic dependencies..."
    pip install flask flask-cors soundfile > /dev/null 2>&1
    echo "Installing numpy, scipy, and librosa (pre-compiled wheels)..."
    pip install --only-binary :all: scipy librosa > /dev/null 2>&1
    cd ..
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    # Check if dependencies are installed
    cd backend
    source venv/bin/activate
    if ! python -c "import flask" 2>/dev/null; then
        echo -e "${YELLOW}🔧 Installing missing backend dependencies...${NC}"
        pip install --upgrade pip > /dev/null 2>&1
        pip install flask flask-cors soundfile > /dev/null 2>&1
        pip install --only-binary :all: scipy librosa > /dev/null 2>&1
        echo -e "${GREEN}✅ Backend dependencies installed${NC}"
    fi
    cd ..
fi

# Check frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}🔧 Installing frontend dependencies...${NC}"
    cd frontend
    npm install > /dev/null 2>&1
    cd ..
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
fi

echo ""
echo -e "${GREEN}✅ Dependencies ready${NC}"
echo ""
echo -e "${BLUE}🚀 Starting services...${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${BLUE}🛑 Stopping services...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${GREEN}[Backend]${NC} Starting Python server on http://localhost:5000"
cd backend
source venv/bin/activate
python server.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo -e "${BLUE}⏳ Waiting for backend to start...${NC}"
sleep 3

# Check if backend is running
MAX_RETRIES=10
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend started successfully${NC}"
        break
    fi
    RETRY=$((RETRY+1))
    if [ $RETRY -eq $MAX_RETRIES ]; then
        echo -e "${RED}❌ Backend failed to start. Check backend.log for details:${NC}"
        tail -10 backend.log
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

# Start frontend
echo ""
echo -e "${GREEN}[Frontend]${NC} Starting Next.js on http://localhost:3000"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "=============================================="
echo -e "${GREEN}🎉 BPMETER is running!${NC}"
echo "=============================================="
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🐍 Backend:  http://localhost:5000"
echo ""
echo "Logs:"
echo "  Backend:  tail -f backend.log"
echo "  Frontend: tail -f frontend.log"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for both processes
wait
