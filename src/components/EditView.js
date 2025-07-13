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
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Edit Lesson</h2>
      <div className="flex flex-col items-center w-full">
        <label className="mb-1 text-white text-center">
          Edit title (max 60 characters):
        </label>
        <input
          type="text"
          maxLength={60}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-1/2 p-4 mb-2 border rounded bg-white text-black text-xl text-center"
        />
        <label className="mb-1 text-white text-center">Edit text:</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-1/2 h-48 p-4 mb-2 border rounded bg-white text-black text-xl"
        />
        <button
          onClick={handleSave}
          className="px-5 py-2 bg-primary text-white rounded hover:bg-blue-600 mr-2"
        >
          💾 Save
        </button>
        <button
          onClick={() => navigate("/library")}
          className="px-5 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EditView;
