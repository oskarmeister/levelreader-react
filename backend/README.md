# LevelReader Backend

A comprehensive Node.js backend server for the LevelReader application, designed to work seamlessly with Builder.io and cloud environments.

## Features

### 📄 File Processing

- **PDF extraction** using pdf-parse
- **DOCX processing** using mammoth
- **EPUB extraction** using yauzl
- **Subtitle parsing** (SRT, VTT, ASS, TTML)
- **Text file handling**
- **50MB file size limit**

### 🔐 Authentication

- JWT-based authentication
- User registration and login
- Password hashing with bcryptjs
- Token expiration handling

### 💾 Data Storage

- User lesson management
- Word metadata storage
- Translation cache
- Deleted words tracking

### ☁️ Cloud Ready

- CORS enabled for all origins
- Environment variable configuration
- Docker support
- Health check endpoints
- Error handling middleware

## API Endpoints

### File Upload

```
POST /upload
POST /api/upload
```

- Upload and process files
- Supports: PDF, DOCX, EPUB, SRT, VTT, ASS, TTML, TXT
- Returns extracted text content

### Authentication

```
POST /register
POST /login
```

- User registration with email/password
- JWT token generation

### User Data

```
GET /user_data    (requires auth)
POST /user_data   (requires auth)
```

- Retrieve and save user application data

### Health Check

```
GET /health
GET /
```

- Server status and feature information

## Installation

### Local Development

```bash
cd backend
npm install
npm start
```

### Docker Deployment

```bash
cd backend
docker build -t levelreader-backend .
docker run -p 5000:5000 levelreader-backend
```

### Builder.io Integration

1. Deploy backend to your preferred cloud platform
2. Update frontend API URLs to point to your backend
3. Set environment variables for production

## Environment Variables

```bash
PORT=5000                    # Server port
SECRET_KEY=your_jwt_secret   # JWT signing key
NODE_ENV=production          # Environment
MAX_FILE_SIZE=52428800       # Max upload size (50MB)
```

## Supported File Formats

| Format    | Extension  | Processing Library | Notes                      |
| --------- | ---------- | ------------------ | -------------------------- |
| PDF       | .pdf       | pdf-parse          | Full text extraction       |
| Word      | .docx      | mammoth            | Text with basic formatting |
| EPUB      | .epub      | yauzl              | HTML content extraction    |
| Subtitles | .srt, .vtt | srt-parser-2       | Timeline removal           |
| Text      | .txt       | fs                 | Direct reading             |
| MOBI      | .mobi      | -                  | Conversion message only    |

## Error Handling

The backend includes comprehensive error handling:

- File type validation
- Size limit enforcement
- JWT token validation
- Graceful error responses
- Automatic file cleanup

## Security Features

- CORS protection
- JWT token authentication
- Password hashing
- File type validation
- Request size limits
- Input sanitization

## Performance

- Stream-based file processing
- Automatic temporary file cleanup
- Memory-efficient PDF parsing
- Configurable upload limits

## Builder.io Compatibility

This backend is specifically designed to work with Builder.io:

- CORS enabled for all origins
- Environment-based configuration
- Health check endpoints
- Docker support for easy deployment
- Multiple endpoint fallbacks in frontend

## Development

### Adding New File Types

1. Add extension to `allowedExtensions` array
2. Create extraction function in file processing section
3. Add case in `extractText` function
4. Update frontend file type validation

### Custom Deployment

The backend can be deployed to any Node.js hosting platform:

- Heroku
- Vercel
- Netlify Functions
- AWS Lambda
- Google Cloud Functions
- DigitalOcean App Platform

## Troubleshooting

### Common Issues

1. **File upload fails**: Check file size and type
2. **Authentication errors**: Verify JWT secret key
3. **CORS issues**: Ensure proper origin configuration
4. **Memory issues**: Reduce file size limits

### Debug Mode

Set `NODE_ENV=development` for verbose logging.

## License

MIT License - see LICENSE file for details.
