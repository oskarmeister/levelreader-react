# Backend Deployment Guide

This guide explains how to run the LevelReader backend separately while keeping it accessible from Builder.io.

## 🚀 Quick Start Options

### Option 1: Local Backend + Tunnel (Easiest)

Run the backend locally and expose it to the internet:

#### Step 1: Start Local Backend

```bash
# Linux/Mac
chmod +x start-backend-local.sh
./start-backend-local.sh

# Windows
start-backend-local.bat

# Or manually:
cd backend
npm install
node server.js
```

#### Step 2: Expose with Tunnel

Install and use ngrok (free):

```bash
# Install ngrok: https://ngrok.com/download
npm install -g ngrok

# Expose your local backend
ngrok http 5001
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`) and update your frontend.

#### Step 3: Update Frontend

Add your ngrok URL to the frontend:

```javascript
// In src/components/ImportView.js, update backendUrls:
const backendUrls = [
  "https://abc123.ngrok.io/upload", // Your ngrok URL
  "/api/upload",
  "http://localhost:5001/upload",
];
```

### Option 2: Deploy to Cloud Service

Deploy the backend to a cloud platform:

#### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy backend
cd backend
vercel --prod
```

#### Heroku

```bash
# Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
cd backend
git init
git add .
git commit -m "Initial commit"
heroku create your-app-name
git push heroku main
```

#### Railway

```bash
# Install Railway CLI: https://railway.app/cli
cd backend
railway login
railway init
railway up
```

### Option 3: Docker Deployment

Run the backend in Docker:

```bash
cd backend
docker build -t levelreader-backend .
docker run -p 5001:5001 levelreader-backend
```

## 🔧 Frontend Configuration

Update your frontend to point to your backend URL:

<function_calls>
<invoke name="Write">
<parameter name="title">Create backend configuration helper
