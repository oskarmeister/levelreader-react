#!/bin/bash

echo "🚀 Starting LevelReader Backend Locally..."
echo "📍 This will run on http://localhost:5001"
echo ""

# Navigate to backend directory
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the backend server
echo "🔄 Starting backend server..."
node server.js
