const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const yauzl = require("yauzl");
const srtParser = require("srt-parser-2");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
const port = process.env.PORT || 5000;

// Configuration
const SECRET_KEY =
  process.env.SECRET_KEY || "your_secret_key_change_in_production";
const UPLOAD_FOLDER = "uploads";

// Enable CORS for all origins (important for Builder.io)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Configure multer for file uploads
const upload = multer({
  dest: UPLOAD_FOLDER,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [
      ".pdf",
      ".epub",
      ".docx",
      ".mobi",
      ".srt",
      ".ass",
      ".vtt",
      ".ttml",
      ".txt",
    ];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"), false);
    }
  },
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOAD_FOLDER)) {
  fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
}

// In-memory storage (use a proper database in production)
let users = {};
let userData = {};

// Utility functions
function allowedFile(filename) {
  const allowedExtensions = [
    "pdf",
    "epub",
    "docx",
    "mobi",
    "srt",
    "ass",
    "vtt",
    "ttml",
    "txt",
  ];
  return (
    filename &&
    filename.includes(".") &&
    allowedExtensions.includes(filename.split(".").pop().toLowerCase())
  );
}

// File extraction functions
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

async function extractTextFromDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error(`DOCX extraction failed: ${error.message}`);
  }
}

async function extractTextFromEPUB(buffer) {
  return new Promise((resolve, reject) => {
    // Create a temporary file for EPUB processing
    const tempFile = path.join(UPLOAD_FOLDER, `temp_${Date.now()}.epub`);
    fs.writeFileSync(tempFile, buffer);

    yauzl.open(tempFile, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        fs.unlinkSync(tempFile);
        reject(new Error(`EPUB extraction failed: ${err.message}`));
        return;
      }

      let text = "";
      const htmlFiles = [];

      zipfile.readEntry();
      zipfile.on("entry", (entry) => {
        if (
          entry.fileName.endsWith(".xhtml") ||
          entry.fileName.endsWith(".html")
        ) {
          zipfile.openReadStream(entry, (err, readStream) => {
            if (!err) {
              let content = "";
              readStream.on("data", (chunk) => (content += chunk));
              readStream.on("end", () => {
                // Basic HTML tag removal
                const cleanText = content
                  .replace(/<[^>]*>/g, " ")
                  .replace(/\s+/g, " ")
                  .trim();
                htmlFiles.push(cleanText);
                zipfile.readEntry();
              });
            } else {
              zipfile.readEntry();
            }
          });
        } else {
          zipfile.readEntry();
        }
      });

      zipfile.on("end", () => {
        fs.unlinkSync(tempFile);
        resolve(htmlFiles.join("\n\n"));
      });
    });
  });
}

function extractTextFromSubtitles(content, extension) {
  try {
    if (extension === "srt") {
      const parser = new srtParser();
      const subtitles = parser.fromSrt(content);
      return subtitles.map((sub) => sub.text).join("\n");
    } else if (extension === "vtt") {
      // Basic VTT parsing
      const lines = content.split("\n");
      const textLines = lines.filter(
        (line) =>
          !line.startsWith("WEBVTT") &&
          !line.includes("-->") &&
          !line.match(/^\d+$/) &&
          line.trim() !== "",
      );
      return textLines.join("\n");
    } else {
      // For ASS, TTML, and other formats, return raw content
      return content;
    }
  } catch (error) {
    throw new Error(`Subtitle extraction failed: ${error.message}`);
  }
}

async function extractText(filePath, fileExtension, buffer) {
  try {
    switch (fileExtension.toLowerCase()) {
      case "pdf":
        return await extractTextFromPDF(buffer);

      case "docx":
        return await extractTextFromDOCX(buffer);

      case "epub":
        return await extractTextFromEPUB(buffer);

      case "mobi":
        return "MOBI files require additional processing. Please convert to EPUB or PDF format.";

      case "srt":
      case "vtt":
      case "ass":
      case "ttml":
        const content = fs.readFileSync(filePath, "utf-8");
        return extractTextFromSubtitles(content, fileExtension);

      case "txt":
        return fs.readFileSync(filePath, "utf-8");

      default:
        throw new Error("Unsupported file format");
    }
  } catch (error) {
    throw new Error(`Text extraction failed: ${error.message}`);
  }
}

// Middleware for token verification
function tokenRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token is missing" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    req.currentUser = decoded.username;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token is invalid" });
  }
}

// Routes
app.get("/", (req, res) => {
  res.json({
    status: "Backend server is running",
    features: [
      "File upload and text extraction",
      "PDF, DOCX, EPUB processing",
      "Subtitle file processing",
      "User authentication",
      "User data storage",
    ],
    supportedFormats: [
      "pdf",
      "epub",
      "docx",
      "mobi",
      "srt",
      "ass",
      "vtt",
      "ttml",
      "txt",
    ],
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// File upload endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file part" });
  }

  if (!req.file.originalname || req.file.originalname === "") {
    return res.status(400).json({ error: "No selected file" });
  }

  if (!allowedFile(req.file.originalname)) {
    // Clean up uploaded file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ error: "File type not allowed" });
  }

  try {
    const fileExtension = path
      .extname(req.file.originalname)
      .toLowerCase()
      .slice(1);
    const buffer = fs.readFileSync(req.file.path);
    const extractedText = await extractText(
      req.file.path,
      fileExtension,
      buffer,
    );

    // Clean up uploaded file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      text: extractedText,
      filename: req.file.originalname,
      fileType: fileExtension,
    });
  } catch (error) {
    // Clean up uploaded file even on error
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// User registration
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email, and password are required" });
    }

    if (users[username]) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    users[username] = {
      email,
      password_hash: passwordHash,
    };

    userData[username] = {
      lessons: {},
      word_metadata: {},
      translation_cache: {},
      deleted_words: [],
    };

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    const user = users[username];
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "24h" });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user data
app.get("/user_data", tokenRequired, (req, res) => {
  try {
    const data = userData[req.currentUser] || {};
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save user data
app.post("/user_data", tokenRequired, (req, res) => {
  try {
    userData[req.currentUser] = req.body;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint for frontend (relative URL support)
app.post("/api/upload", upload.single("file"), async (req, res) => {
  // Redirect to main upload endpoint
  req.url = "/upload";
  app._router.handle(req, res);
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File too large. Maximum size is 50MB." });
    }
  }
  res.status(500).json({ error: error.message });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Start server
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Backend server running on http://0.0.0.0:${port}`);
  console.log(`📁 Supported file formats: PDF, DOCX, EPUB, SRT, VTT, TXT`);
  console.log(`🔐 Authentication: JWT-based`);
  console.log(`☁️  Builder.io compatible: Yes`);
});

module.exports = app;
