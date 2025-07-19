#!/bin/bash

echo "🚀 Starting Agent Ops Backend Services..."
echo "========================================"

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Port $1 is already in use!"
        echo "   Please stop the process using: lsof -ti:$1 | xargs kill -9"
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

# Check if required ports are available
echo "📋 Checking port availability..."
check_port 8000
check_port 3001

echo ""
echo "📚 Starting servers:"
echo "   🐍 Python FastAPI Server (Main Backend): http://localhost:8000"
echo "   📋 Docs: http://localhost:8000/docs"
echo "   🟦 TypeScript Pipeline Server: http://localhost:3001"
echo ""

# Start Python FastAPI server (main backend) on port 8000
echo "🐍 Starting Python FastAPI server on port 8000..."
cd backend
python run.py &
PYTHON_PID=$!

# Wait a moment for Python server to start
sleep 3

# Start TypeScript pipeline server on port 3001  
echo "🟦 Starting TypeScript pipeline server on port 3001..."
PORT=3001 npx tsx src/api/server.ts &
TYPESCRIPT_PID=$!

echo ""
echo "✅ Both servers started successfully!"
echo "📋 Process IDs:"
echo "   🐍 Python Server PID: $PYTHON_PID"
echo "   🟦 TypeScript Server PID: $TYPESCRIPT_PID"
echo ""
echo "🌐 Available endpoints:"
echo "   Main Backend: http://localhost:8000/docs"
echo "   Pipeline API: http://localhost:8000/api/pipeline/full"
echo "   Health Check: http://localhost:8000/health"
echo ""
echo "🛑 To stop both servers:"
echo "   kill $PYTHON_PID $TYPESCRIPT_PID"
echo "   or press Ctrl+C to stop this script"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $PYTHON_PID 2>/dev/null
    kill $TYPESCRIPT_PID 2>/dev/null
    echo "✅ Servers stopped."
    exit 0
}

# Setup trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for background processes
wait 