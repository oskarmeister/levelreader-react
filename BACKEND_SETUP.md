# Backend Setup for PDF Import

This application supports importing PDF files and other document formats through a Python Flask backend.

## Quick Setup

### Option 1: Use NPM Script (Recommended)

```bash
npm run backend
```

This will automatically install the required Python dependencies and start the backend server.

### Option 2: Manual Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the Flask server
python app.py
```

## Supported File Formats

### Direct Import (No Backend Required)

- `.txt` - Plain text files

### Backend-Powered Import

- `.pdf` - PDF documents (using PyMuPDF)
- `.docx` - Microsoft Word documents
- `.epub` - E-book files
- `.mobi` - Kindle files (limited support)
- `.srt`, `.vtt`, `.ass`, `.ttml` - Subtitle files

## Troubleshooting

### Backend Not Starting

1. Ensure Python 3.7+ is installed
2. Install dependencies: `pip install -r backend/requirements.txt`
3. Check if port 5000 is available

### PDF Import Not Working

1. Verify the backend server is running on `http://localhost:5000`
2. Check browser console for error messages
3. Try with a simple text file first to test the interface

### Dependencies Issues

If you encounter dependency installation issues, try:

```bash
pip install --upgrade pip
pip install -r backend/requirements.txt --force-reinstall
```

## Development

The backend runs on `http://localhost:5000` and the React frontend on `http://localhost:3000`. The frontend automatically falls back to basic text file reading if the backend is not available.

## Production Notes

- Change the `SECRET_KEY` in `backend/app.py` for production use
- Consider using a proper database instead of in-memory storage
- Set up proper CORS policies for production domains
