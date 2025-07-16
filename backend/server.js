const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 5000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Basic text extraction (for demonstration)
function extractText(filePath, fileExtension) {
  try {
    if (fileExtension === "txt") {
      return fs.readFileSync(filePath, "utf8");
    } else if (["srt", "vtt"].includes(fileExtension)) {
      // Basic subtitle file processing
      const content = fs.readFileSync(filePath, "utf8");
      // Remove timestamp lines and extract just the text
      return content
        .split("\n")
        .filter(
          (line) =>
            !line.match(/^\d+$/) &&
            !line.match(/\d{2}:\d{2}:\d{2}/) &&
            line.trim(),
        )
        .join("\n");
    } else {
      return `${fileExtension.toUpperCase()} file processing requires additional libraries. Please convert to text format.`;
    }
  } catch (error) {
    return `Error reading file: ${error.message}`;
  }
}

// Upload endpoint
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileExtension = path
    .extname(req.file.originalname)
    .toLowerCase()
    .slice(1);
  const filePath = req.file.path;

  try {
    const extractedText = extractText(filePath, fileExtension);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({ text: extractedText });
  } catch (error) {
    // Clean up uploaded file even on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "Backend server is running" });
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
