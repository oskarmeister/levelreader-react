# 🚀 Deploy LevelReader Backend Separately

This guide shows you how to run the LevelReader backend on a separate server while keeping it accessible from Builder.io.

## 📋 Quick Setup Options

### 🔥 Option 1: Local + Tunnel (Fastest)

Perfect for development and testing:

#### 1. Start Local Backend

```bash
# Clone/navigate to your project
cd your-project

# Start backend (choose your platform):

# Windows:
start-backend-local.bat

# Mac/Linux:
chmod +x start-backend-local.sh
./start-backend-local.sh

# Manual:
cd backend
npm install
node server.js
```

#### 2. Expose via Tunnel

```bash
# Install ngrok (free): https://ngrok.com/download
npm install -g ngrok

# Expose your backend
ngrok http 5001
```

Copy the HTTPS URL from ngrok (e.g., `https://abc123.ngrok.io`)

#### 3. Update Frontend Configuration

Edit `src/config/backendConfig.js`:

```javascript
const BACKEND_CONFIG = {
  // Replace with your ngrok URL
  tunnel: "https://abc123.ngrok.io",
  // ... rest of config
};
```

#### 4. Test

- Upload a PDF file in your Builder.io app
- Check the browser console for successful connections
- Backend logs should show incoming requests

---

### ☁️ Option 2: Cloud Deployment

Deploy to a cloud platform for production use:

#### Vercel (Recommended - Free)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd backend
vercel --prod

# Copy the deployment URL and update frontend config
```

#### Heroku (Free tier available)

```bash
# Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
cd backend
git init
git add .
git commit -m "Initial backend"
heroku create your-app-name
git push heroku main

# Your URL: https://your-app-name.herokuapp.com
```

#### Railway (Simple deployment)

```bash
# Install Railway CLI: https://railway.app/cli
cd backend
railway login
railway init
railway up

# Copy the deployment URL
```

#### DigitalOcean App Platform

1. Go to https://cloud.digitalocean.com/apps
2. Create new app from GitHub
3. Select the `backend` folder
4. Deploy with default Node.js settings

---

### 🐳 Option 3: Docker

Run in any Docker-compatible environment:

```bash
# Build Docker image
cd backend
docker build -t levelreader-backend .

# Run locally
docker run -p 5001:5001 levelreader-backend

# Or deploy to any cloud Docker service
```

---

## 🔧 Frontend Configuration

After deploying your backend, update the frontend:

### 1. Edit Backend Config

File: `src/config/backendConfig.js`

```javascript
const BACKEND_CONFIG = {
  // Update with your deployed URL
  production: "https://your-backend-url.vercel.app",

  // Or if using tunnel:
  tunnel: "https://abc123.ngrok.io",

  // Keep the rest as-is
  development: ["http://localhost:5001", "http://localhost:5000"],
  // ...
};
```

### 2. Verify Configuration

The frontend automatically tries URLs in this order:

1. Tunnel URL (if configured)
2. Production URL (if configured)
3. Relative URLs (same domain)
4. Local development URLs

---

## 🧪 Testing Your Setup

### 1. Test Backend Health

Visit your backend URL in browser:

```
https://your-backend-url.com/health
```

Should return: `{"status":"OK","timestamp":"..."}`

### 2. Test File Upload

In your Builder.io app:

1. Go to Import section
2. Upload a PDF file
3. Check browser console for success/error messages
4. Check backend logs for incoming requests

### 3. Test Different File Types

Try uploading:

- PDF files (✅ Should extract text)
- DOCX files (✅ Should extract text)
- TXT files (✅ Should work without backend)
- SRT subtitle files (✅ Should extract text)

---

## 🔒 Security Considerations

### CORS Configuration

The backend is configured to allow all origins for Builder.io compatibility:

```javascript
app.use(
  cors({
    origin: "*", // Allows Builder.io access
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
```

### Production Security

For production, consider:

1. Limiting CORS origins to specific domains
2. Adding rate limiting
3. Using environment variables for secrets
4. Adding request validation

---

## 📊 Monitoring

### Backend Logs

Monitor your backend for:

- File upload requests
- Processing errors
- Memory usage
- Response times

### Frontend Debugging

Check browser console for:

- Backend connection attempts
- Successful file processing
- Error messages

---

## ❓ Troubleshooting

### "Backend not available" error

1. Check if backend is running
2. Verify URL in configuration
3. Check CORS settings
4. Test backend health endpoint

### File upload fails

1. Check file size (50MB limit)
2. Verify file type is supported
3. Check backend logs for errors
4. Test with smaller files first

### Tunnel connection issues

1. Restart ngrok
2. Update frontend config with new URL
3. Check firewall settings

---

## 🎯 Production Recommendations

### Best Deployment Options:

1. **Vercel** - Best for simple deployment
2. **Railway** - Good balance of features and simplicity
3. **Heroku** - Established platform with good documentation
4. **DigitalOcean** - More control, affordable

### Environment Variables:

Set these in your deployment:

```bash
NODE_ENV=production
SECRET_KEY=your-secure-jwt-secret
PORT=5001
```

### Domain Setup:

For custom domains, point your domain to the deployment URL and update the frontend configuration accordingly.

---

## 📞 Support

If you need help:

1. Check the backend logs for errors
2. Test the health endpoint
3. Verify the frontend configuration
4. Check network connectivity between frontend and backend

The setup is designed to be flexible and work across different deployment scenarios while maintaining compatibility with Builder.io's cloud environment.
