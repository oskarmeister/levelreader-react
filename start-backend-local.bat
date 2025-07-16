@echo off
echo 🚀 Starting LevelReader Backend Locally...
echo 📍 This will run on http://localhost:5001
echo.

REM Navigate to backend directory
cd backend

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Start the backend server
echo 🔄 Starting backend server...
node server.js

pause
