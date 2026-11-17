#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse Arguments
LOG_LEVEL="info"
DEBUG_MODE=false
USE_NGROK=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        -d|--debug) 
            DEBUG_MODE=true
            LOG_LEVEL="debug" 
            ;;
        -o)
            USE_NGROK=true
            ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

if [ "$DEBUG_MODE" = true ]; then
    echo -e "${BLUE}Debug mode enabled. Log level set to debug.${NC}"
    export DEBUG=true
fi

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -t -i :$port)
    if [ ! -z "$pid" ]; then
        echo -e "${BLUE}Killing process on port $port (PID: $pid)...${NC}"
        kill -9 $pid
    fi
}

echo -e "${BLUE}Starting Toonify Development Environment...${NC}"

# Cleanup existing processes
echo "Cleaning up ports 8000 and 3000..."
kill_port 8000
kill_port 3000

# Check for .env.local files
if [ ! -f "backend/.env.local" ]; then
    echo -e "${BLUE}ERROR: backend/.env.local not found. Please create it.${NC}"
    exit 1
fi

if [ ! -f "frontend/.env.local" ]; then
    echo -e "${BLUE}ERROR: frontend/.env.local not found. Please create it.${NC}"
    exit 1
fi


# Backend Setup
echo -e "${GREEN}Setting up Backend...${NC}"
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Installing backend requirements..."
./venv/bin/pip install -r requirements.txt

# Frontend Setup
echo -e "${GREEN}Setting up Frontend...${NC}"
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Start Docker Services
echo -e "${BLUE}Restarting Docker Services...${NC}"
cd ..
docker compose down
docker compose up &
DOCKER_PID=$!

# Wait for services to be ready
echo "Waiting for services to initialize..."
sleep 5

# Start Services
echo -e "${BLUE}Starting Servers...${NC}"

# Start Backend in background
cd backend

# Setup Google Cloud Credentials
GCLOUD_CRED_PATH="$HOME/.config/gcloud/application_default_credentials.json"
TARGET_CRED_PATH="application_default_credentials.json"
if [ -f "$GCLOUD_CRED_PATH" ]; then
    echo "Copying gcloud credentials..."
    cp "$GCLOUD_CRED_PATH" "$TARGET_CRED_PATH"
    export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/$TARGET_CRED_PATH"
    echo "GOOGLE_APPLICATION_CREDENTIALS set to $(pwd)/$TARGET_CRED_PATH"
else
    echo "WARNING: gcloud credentials not found at $GCLOUD_CRED_PATH"
fi

./venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --log-level $LOG_LEVEL &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"

# Run Database Seeding
echo -e "${GREEN}Seeding Database...${NC}"
./venv/bin/python seed_db.py

# Start Frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"

# Start Ngrok if requested
NGROK_PID=""
if [ "$USE_NGROK" = true ]; then
    echo -e "${BLUE}Starting Ngrok on port 3000...${NC}"
    ngrok http 3000 &
    NGROK_PID=$!
    echo "Ngrok started (PID: $NGROK_PID)"
fi

# Handle Shutdown
trap "kill $BACKEND_PID $FRONTEND_PID $DOCKER_PID $NGROK_PID; exit" SIGINT SIGTERM

wait
