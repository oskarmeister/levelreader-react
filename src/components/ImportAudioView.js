import React, { useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AppContext from "../context/AppContext";

const ImportAudioView = () => {
  const { state } = useContext(AppContext);
  const navigate = useNavigate();
  const [audioFiles, setAudioFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_FILES = 100;

  const validateAudioFile = (file) => {
    const audioTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/flac",
      "audio/aac",
      "audio/m4a",
      "audio/webm",
    ];
    return (
      audioTypes.includes(file.type) || file.name.toLowerCase().endsWith(".mp3")
    );
  };

  const processFiles = (files) => {
    const fileArray = Array.from(files);
    const validAudioFiles = fileArray.filter(validateAudioFile);

    if (validAudioFiles.length === 0) {
      alert(
        "Please select valid audio files (.mp3, .wav, .ogg, .flac, .aac, .m4a)",
      );
      return;
    }

    const remainingSlots = MAX_FILES - audioFiles.length;
    const filesToAdd = validAudioFiles.slice(0, remainingSlots);

    if (filesToAdd.length < validAudioFiles.length) {
      alert(
        `Maximum ${MAX_FILES} files allowed. Only ${filesToAdd.length} files will be added.`,
      );
    }

    const processedFiles = filesToAdd.map((file, index) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);

      return new Promise((resolve) => {
        audio.onloadedmetadata = () => {
          const duration = Math.round(audio.duration);
          const size = (file.size / (1024 * 1024)).toFixed(1);
          resolve({
            id: Date.now() + index,
            name: file.name,
            duration: `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}`,
            size: `${size} MB`,
            file: file,
            url: url,
            status: "ready",
          });
        };

        audio.onerror = () => {
          resolve({
            id: Date.now() + index,
            name: file.name,
            duration: "Unknown",
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            file: file,
            url: url,
            status: "error",
          });
        };

        audio.src = url;
      });
    });

    Promise.all(processedFiles).then((newFiles) => {
      setAudioFiles((prev) => [...prev, ...newFiles]);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting same files again
    e.target.value = "";
  };

  const removeFile = (id) => {
    setAudioFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove?.url) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const clearAllFiles = () => {
    audioFiles.forEach((file) => {
      if (file.url) {
        URL.revokeObjectURL(file.url);
      }
    });
    setAudioFiles([]);
  };

  const handleUpload = async () => {
    if (audioFiles.length === 0) {
      alert("Please select audio files to upload");
      return;
    }

    setUploading(true);

    // Simulate upload process
    try {
      // Here you would implement the actual upload logic
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log(
        "Uploading files:",
        audioFiles.map((f) => f.name),
      );

      // Clear files after successful upload
      clearAllFiles();
      alert("Audio files uploaded successfully!");
      navigate("/library");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getTotalSize = () => {
    const totalBytes = audioFiles.reduce(
      (acc, file) => acc + file.file.size,
      0,
    );
    return formatFileSize(totalBytes);
  };

  return (
    <div
      className="container mx-auto overflow-visible"
      style={{ margin: "0 auto 200px", padding: "16px 16px 0" }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">🎵 Import Audio Files</h2>
        <button
          onClick={() => navigate("/library")}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back to Library
        </button>
      </div>

      {/* Drag and Drop Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 mb-6 ${
          dragOver
            ? "border-purple-400 bg-purple-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        style={{ cursor: "pointer" }}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="text-6xl">🎵</div>
          <div className="text-xl font-semibold text-gray-700">
            Drop audio files here or click to browse
          </div>
          <div className="text-gray-500">
            Supports MP3, WAV, OGG, FLAC, AAC, M4A (Max {MAX_FILES} files)
          </div>
          <div className="text-sm text-gray-400">
            {audioFiles.length} of {MAX_FILES} files selected
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*,.mp3,.wav,.ogg,.flac,.aac,.m4a"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* File Statistics */}
      {audioFiles.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {audioFiles.length}
                </div>
                <div className="text-sm text-gray-500">Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {getTotalSize()}
                </div>
                <div className="text-sm text-gray-500">Total Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {audioFiles.filter((f) => f.status === "ready").length}
                </div>
                <div className="text-sm text-gray-500">Ready</div>
              </div>
            </div>
            <button
              onClick={clearAllFiles}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* File List */}
      {audioFiles.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold">Selected Audio Files</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {audioFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-25 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      file.status === "ready" ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {file.status === "ready" ? "🎵" : "⚠️"}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 truncate max-w-xs">
                      {file.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {file.duration} • {file.size}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-2"
                  title="Remove file"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => navigate("/library")}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={audioFiles.length === 0 || uploading}
          className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading
            ? "Uploading..."
            : `Upload ${audioFiles.length} File${audioFiles.length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
};

export default ImportAudioView;
