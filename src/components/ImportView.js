import React, { useState, useContext } from "react";
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

  const categories = ["news", "hobbies", "food", "movies", "books", "travel"];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.text) setText(data.text);
          else alert(data.error || "Failed to extract text");
        })
        .catch((err) => {
          console.error(err);
          const reader = new FileReader();
          reader.onload = (ev) => setText(ev.target.result);
          reader.readAsText(file);
        });
    }
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
    <div
      className="container mx-auto overflow-visible"
      style={{ margin: "0 auto 200px", padding: "16px 16px 0" }}
    >
      <h2 className="text-2xl font-bold mb-6 overflow-visible">
        📚 Import Lesson
      </h2>

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
                Upload a text file to extract content automatically
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer"
                accept=".txt,.pdf,.doc,.docx"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action section */}
      <div className="flex justify-center">
        <button
          onClick={handleSave}
          className="px-8 py-4 bg-green-600 text-white text-lg font-medium rounded-xl hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all transform hover:scale-105 shadow-lg"
          disabled={!title || !text}
          style={{
            opacity: !title || !text ? 0.6 : 1,
            cursor: !title || !text ? "not-allowed" : "pointer",
          }}
        >
          Save and Generate Lesson
        </button>
      </div>
    </div>
  );
};

export default ImportView;
