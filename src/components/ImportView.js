import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AppContext from "../context/AppContext";
import { StorageManager } from "../storageManager";

const ImportView = () => {
  const { state, setState } = useContext(AppContext);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);

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

  const handleSave = async () => {
    if (title && text) {
      if (state.lessons[title]) return alert("Title already exists.");
      const newState = {
        ...state,
        lessons: { ...state.lessons, [title]: text },
        lessonCategories: {
          ...state.lessonCategories,
          [title]: selectedCategories,
        },
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
