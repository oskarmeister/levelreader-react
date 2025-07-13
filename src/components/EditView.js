import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppContext from "../context/AppContext";
import { StorageManager } from "../storageManager";

const EditView = () => {
  const { state, setState } = useContext(AppContext);
  const { key } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState(key);
  const [text, setText] = useState(state.lessons[key] || "");
  const [selectedCategories, setSelectedCategories] = useState(
    state.lessonCategories?.[key] || [],
  );

  const categories = ["news", "hobbies", "food", "movies", "books", "travel"];

  useEffect(() => {
    setState((prev) => ({ ...prev, editingKey: key }));
  }, [key]);

  const handleSave = async () => {
    if (text.trim()) {
      const newLessons = { ...state.lessons };
      const newCategories = { ...state.lessonCategories };

      delete newLessons[key];
      delete newCategories[key];

      newLessons[title] = text.trim();
      newCategories[title] = selectedCategories;

      const newState = {
        ...state,
        lessons: newLessons,
        lessonCategories: newCategories,
      };

      setState(newState);
      await StorageManager.save(newState);
      navigate("/library");
    } else {
      alert("Text required");
    }
  };

  return (
    <div
      className="container mx-auto overflow-visible"
      style={{ margin: "0 auto 200px", padding: "16px 16px 0" }}
    >
      <h2 className="text-2xl font-bold mb-6 overflow-visible">
        ✏️ Edit Lesson
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
          className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-3 border-b border-gray-100"
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#374151",
            borderLeft: "4px solid #F97316",
          }}
        >
          Edit Lesson Details
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
                className="w-2/3 p-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Enter lesson title..."
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Lesson Content
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-48 p-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Enter or paste lesson content here..."
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Categories
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
                        ? "bg-orange-100 text-orange-800 border-2 border-orange-300"
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

      {/* Action section */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleSave}
          className="px-8 py-4 bg-orange-600 text-white text-lg font-medium rounded-xl hover:bg-orange-700 focus:ring-4 focus:ring-orange-200 transition-all transform hover:scale-105 shadow-lg"
          disabled={!text.trim()}
          style={{
            opacity: !text.trim() ? 0.6 : 1,
            cursor: !text.trim() ? "not-allowed" : "pointer",
          }}
        >
          💾 Save Changes
        </button>
        <button
          onClick={() => navigate("/library")}
          className="px-8 py-4 bg-gray-600 text-white text-lg font-medium rounded-xl hover:bg-gray-700 focus:ring-4 focus:ring-gray-200 transition-all transform hover:scale-105 shadow-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EditView;
