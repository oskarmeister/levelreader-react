import React, { useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppContext from "../context/AppContext";
import { StorageManager } from "../storageManager";
import ChineseSegmentationService from "../services/chineseSegmentationService";

const ImportView = () => {
  const { state, setState } = useContext(AppContext);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [segmentationProgress, setSegmentationProgress] = useState(0);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState(0);

  // New sidebar states
  const [thumbnail, setThumbnail] = useState(null);
  const [accentColor, setAccentColor] = useState("#8B5CF6");
  const [difficulty, setDifficulty] = useState("Difficulty level");
  const [audioFile, setAudioFile] = useState(null);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);

  const audioInputRef = useRef(null);

  const categories = ["news", "hobbies", "food", "movies", "books", "travel"];
  const difficultyLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const accentColors = [
    "#8B5CF6",
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#EC4899",
    "#06B6D4",
    "#84CC16",
  ];

    const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase();

      // Check if it's a PDF or other format that requires backend processing
      if (['pdf', 'epub', 'docx', 'mobi', 'srt', 'ass', 'vtt', 'ttml'].includes(fileExtension)) {
        const formData = new FormData();
        formData.append("file", file);

                        // Try multiple backend endpoints for compatibility
        const backendUrls = [
          "/api/upload",
          "http://localhost:5000/upload",
          "http://localhost:5000/api/upload"
        ];

        let lastError;
        for (const url of backendUrls) {
          try {
            const response = await fetch(url, {
              method: "POST",
              body: formData,
            });
            if (response.ok) {
              return response;
            }
            lastError = new Error(`HTTP ${response.status}`);
          } catch (error) {
            lastError = error;
            continue;
          }
        }
        throw lastError;
          .then((res) => {
            if (!res.ok) {
              throw new Error('Backend server not available');
            }
            return res.json();
          })
          .then((data) => {
            if (data.text) {
              setText(data.text);
              alert(`✅ Successfully extracted text from ${fileExtension.toUpperCase()} file!`);
            } else {
              alert(data.error || "Failed to extract text");
            }
          })
                    .catch((err) => {
            console.error('Backend error:', err);
            if (fileExtension === 'pdf') {
              alert(`❌ PDF import is not available in this environment.\n\nPDF processing requires a backend server. For now, please:\n1. Convert your PDF to a text file, or\n2. Copy and paste the text content directly into the text area below.`);
            } else {
              alert(`❌ ${fileExtension.toUpperCase()} file processing is not available in this environment.\n\nFor now, please:\n1. Convert your file to plain text (.txt), or\n2. Copy and paste the content directly into the text area below.`);
            }
          });
      } else {
        // For text files, read directly
        const reader = new FileReader();
        reader.onload = (ev) => {
          setText(ev.target.result);
          alert(`✅ Successfully loaded text file!`);
        };
        reader.readAsText(file);
      }
    }
  };

  const handleThumbnailUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setThumbnail(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAudioUpload = (file) => {
    if (file && file.type.startsWith("audio/")) {
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        const duration = Math.round(audio.duration);
        const size = (file.size / (1024 * 1024)).toFixed(1);
        setAudioFile({
          name: file.name,
          duration: `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}`,
          size: `${size} MB`,
          file: file,
        });
      };
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleAudioUpload(files[0]);
      setShowAudioModal(false);
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

  const segmentCompleteLesson = async (lessonText) => {
    console.log("🚀 Starting complete lesson segmentation for Chinese text");
    setIsSegmenting(true);
    setSegmentationProgress(0);

    // Calculate estimated time based on text length
    const textLength = lessonText.length;
    const estimatedMinutes = Math.max(1, Math.ceil(textLength / 1000)); // Rough estimate: 1 minute per 1000 characters
    setEstimatedTimeLeft(estimatedMinutes);

    try {
      // Process text in large chunks for import-time segmentation
      const allSegmentedData = [];
      const chunkSize = 500; // Larger chunks for import-time processing
      let processedChars = 0;

      console.log(
        `Processing ${textLength} characters in ${chunkSize}-character chunks`,
      );

      for (let i = 0; i < lessonText.length; i += chunkSize) {
        const chunk = lessonText.substring(i, i + chunkSize);
        console.log(
          `Segmenting chunk ${Math.floor(i / chunkSize) + 1}: ${chunk.length} chars`,
        );

        try {
          const chunkSegmentation =
            await ChineseSegmentationService.segmentChineseSentence(chunk);

          // Adjust positions to be relative to the entire text
          const adjustedSegmentation = chunkSegmentation.map((segment) => ({
            ...segment,
            start: segment.start + i,
            end: segment.end + i,
          }));

          allSegmentedData.push(...adjustedSegmentation);

          processedChars += chunk.length;
          const progress = Math.round((processedChars / textLength) * 100);
          setSegmentationProgress(progress);

          // Update estimated time left
          const remainingChars = textLength - processedChars;
          const remainingMinutes = Math.max(
            0,
            Math.ceil(remainingChars / 1000),
          );
          setEstimatedTimeLeft(remainingMinutes);

          console.log(
            `Progress: ${progress}% - ${processedChars}/${textLength} characters`,
          );

          // Small delay to prevent overwhelming the API
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error segmenting chunk at position ${i}:`, error);
          // Use fallback segmentation for this chunk
          const fallbackSegmentation =
            ChineseSegmentationService.fallbackSegmentation(chunk);
          const adjustedFallback = fallbackSegmentation.map((segment) => ({
            ...segment,
            start: segment.start + i,
            end: segment.end + i,
          }));
          allSegmentedData.push(...adjustedFallback);
        }
      }

      console.log(
        `✅ Lesson segmentation completed: ${allSegmentedData.length} segments`,
      );
      setSegmentationProgress(100);
      setEstimatedTimeLeft(0);

      return allSegmentedData;
    } catch (error) {
      console.error("Failed to segment lesson:", error);
      // Return fallback segmentation for entire text
      return ChineseSegmentationService.fallbackSegmentation(lessonText);
    } finally {
      setIsSegmenting(false);
    }
  };

  const handleSave = async () => {
    if (title && text) {
      if (state.lessons[title]) return alert("Title already exists.");

      let segmentedData = null;

      // If it's Chinese text, segment it during import
      if (state.selectedLanguage === "Chinese") {
        console.log("🔤 Chinese lesson detected - starting segmentation...");
        segmentedData = await segmentCompleteLesson(text);
      }

      const newState = {
        ...state,
        lessons: { ...state.lessons, [title]: text },
        lessonCategories: {
          ...state.lessonCategories,
          [title]: selectedCategories,
        },
        // Add segmented data if available
        ...(segmentedData && {
          lessonSegmentations: {
            ...state.lessonSegmentations,
            [title]: segmentedData,
          },
        }),
      };

      setState(newState);
      await StorageManager.save(newState);
      navigate("/library");
    } else {
      alert("Title and text required.");
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)]" style={{ padding: "16px" }}>
      {/* Left Sidebar */}
      <div className="w-80 bg-white rounded-xl shadow-lg mr-6 flex flex-col h-full">
        <div
          className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b border-gray-100"
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#374151",
            borderLeft: `4px solid ${accentColor}`,
          }}
        >
          📝 Lesson Settings
        </div>

        <div className="p-4 space-y-6 flex-1 overflow-y-auto">
          {/* Thumbnail */}
          <div>
            <div
              className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors relative overflow-hidden"
              onClick={() => document.getElementById("thumbnail-input").click()}
            >
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-2xl mb-1">🖼️</div>
                  <span className="text-sm">Click to add thumbnail</span>
                </div>
              )}
              <input
                id="thumbnail-input"
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <div className="relative">
              <button
                className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 transition-colors"
                onClick={() => setShowColorDropdown(!showColorDropdown)}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span className="text-sm font-medium">{accentColor}</span>
                </div>
                <span className="text-gray-400">▼</span>
              </button>

              {showColorDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowColorDropdown(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3">
                    <div className="grid grid-cols-4 gap-2">
                      {accentColors.map((color) => (
                        <button
                          key={color}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            accentColor === color
                              ? "border-gray-800 scale-110"
                              : "border-gray-200 hover:border-gray-400"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            setAccentColor(color);
                            setShowColorDropdown(false);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <div className="relative">
              <button
                className={`w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 transition-colors ${
                  difficulty === "Difficulty level"
                    ? "text-gray-500"
                    : "text-gray-900"
                }`}
                onClick={() =>
                  setShowDifficultyDropdown(!showDifficultyDropdown)
                }
              >
                <span className="text-sm font-medium">{difficulty}</span>
                <span className="text-gray-400">▼</span>
              </button>

              {showDifficultyDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDifficultyDropdown(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                    {difficultyLevels.map((level) => (
                      <button
                        key={level}
                        className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-gray-50 ${
                          difficulty === level ? "text-white" : "text-gray-700"
                        }`}
                        style={
                          difficulty === level
                            ? { backgroundColor: accentColor }
                            : {}
                        }
                        onClick={() => {
                          setDifficulty(level);
                          setShowDifficultyDropdown(false);
                        }}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Audio File */}
          <div>
            {audioFile ? (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    🎵
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {audioFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {audioFile.duration} • {audioFile.size}
                    </p>
                  </div>
                  <button
                    onClick={() => setAudioFile(null)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAudioModal(true)}
                className="w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition-all flex items-center justify-center space-x-2"
              >
                <span className="text-lg">+</span>
                <span className="text-sm font-medium">Add audio track</span>
              </button>
            )}
          </div>

          {/* URL */}
          <div>
            {showUrlInput ? (
              <div className="space-y-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setShowUrlInput(false);
                      setUrlInput("");
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      console.log("URL saved:", urlInput);
                      setShowUrlInput(false);
                    }}
                    className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowUrlInput(true)}
                className="w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition-all flex items-center justify-center space-x-2"
              >
                <span className="text-lg">+</span>
                <span className="text-sm font-medium">Add URL</span>
              </button>
            )}
          </div>

          {/* Generate Audio Transcription */}
          <div>
            <button
              onClick={() =>
                console.log("Generate transcription for:", audioFile?.name)
              }
              disabled={!audioFile}
              className={`w-full p-3 rounded-lg text-sm font-medium transition-all ${
                audioFile
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border-2 border-blue-200"
                  : "bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed"
              }`}
            >
              🎤 Generate audio transcription
            </button>
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">📚 Import Lesson</h2>

          {/* Lesson Details section */}
          <div
            className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden"
            style={{
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            }}
          >
            <div
              className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-3 border-b border-gray-100"
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#374151",
                borderLeft: "4px solid #10B981",
              }}
            >
              Lesson Details
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Lesson Title (max 60 characters)
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-2/3 p-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter lesson title..."
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Lesson Content (optional)
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full h-48 p-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter or paste lesson content here..."
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Categories (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => {
                          setSelectedCategories((prev) =>
                            prev.includes(category)
                              ? prev.filter((c) => c !== category)
                              : [...prev, category],
                          );
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedCategories.includes(category)
                            ? "bg-green-100 text-green-800 border-2 border-green-300"
                            : "bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200"
                        }`}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* File Upload section */}
          <div
            className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden"
            style={{
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            }}
          >
            <div
              className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 border-b border-gray-100"
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#374151",
                borderLeft: "4px solid #3B82F6",
              }}
            >
              Upload File
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center space-y-4">
                                <div className="w-full max-w-md">
                  <label className="block text-gray-700 text-sm font-medium mb-2 text-center">
                    Upload a file to extract content automatically
                  </label>
                                    <div className="text-xs text-gray-500 mb-3 text-center">
                    ✅ Text files: .txt (supported) <br/>
                    ⚠️ Documents: .pdf, .docx, .epub (backend required) <br/>
                    ⚠️ Subtitles: .srt, .vtt, .ass, .ttml (backend required)
                  </div>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer"
                    accept=".txt,.pdf,.doc,.docx,.epub,.mobi,.srt,.ass,.vtt,.ttml"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Segmentation Progress section */}
          {isSegmenting && (
            <div className="bg-white rounded-xl shadow-lg mb-8 p-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mr-3"></div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    🔤 Segmenting Chinese Text...
                  </h3>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                  <div
                    className="bg-purple-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${segmentationProgress}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress: {segmentationProgress}%</span>
                  <span>
                    {estimatedTimeLeft > 0
                      ? `Est. ${estimatedTimeLeft} minute${estimatedTimeLeft !== 1 ? "s" : ""} remaining`
                      : "Almost done..."}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mt-3">
                  This lesson is being optimized for better word recognition.
                  This only needs to be done once!
                </p>
              </div>
            </div>
          )}

          {/* Action section */}
          <div className="flex justify-center pb-8">
            <button
              onClick={handleSave}
              className="px-8 py-4 bg-green-600 text-white text-lg font-medium rounded-xl hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={!title || !text || isSegmenting}
            >
              {isSegmenting ? "Processing..." : "Save and Generate Lesson"}
            </button>
          </div>
        </div>
      </div>

      {/* Audio Upload Modal */}
      {showAudioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Audio File</h3>
              <button
                onClick={() => setShowAudioModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver ? "border-purple-400 bg-purple-50" : "border-gray-300"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="text-4xl mb-4">🎵</div>
              <p className="text-gray-600 mb-4">
                Drag and drop an MP3 file here, or click to select
              </p>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    handleAudioUpload(e.target.files[0]);
                    setShowAudioModal(false);
                  }
                }}
                className="hidden"
              />
              <button
                onClick={() => audioInputRef.current?.click()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Select File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportView;