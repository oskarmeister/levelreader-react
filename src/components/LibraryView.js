import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppContext from "../context/AppContext";
import { StorageManager } from "../storageManager";
import ConfirmationModal from "./ConfirmationModal";

const LibraryView = () => {
  const { state, setState } = useContext(AppContext);
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    lessonKey: null,
  });
  const [showImportOptions, setShowImportOptions] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    if (openDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openDropdown]);

  const categories = ["news", "hobbies", "food", "movies", "books", "travel"];

  const getLessonsForCategory = (category) => {
    return Object.entries(state.lessons).filter(([key]) => {
      const lessonCategories = state.lessonCategories?.[key] || [];
      return lessonCategories.includes(category);
    });
  };

  const getRecentlyStudiedLessons = () => {
    return state.recentlyAccessedLessons?.slice(0, 10) || [];
  };

  const isLessonSegmenting = (lessonKey) => {
    // Check if this is a Chinese lesson that doesn't have segmentation data yet
    return (
      state.selectedLanguage === "Chinese" &&
      !state.lessonSegmentations?.[lessonKey] &&
      state.lessons[lessonKey]
    );
  };

  const renderLessonCards = (lessons = null) => {
    const lessonsToRender = lessons || Object.entries(state.lessons);
    return lessonsToRender.map(([key, text]) => {
      const isSegmenting = isLessonSegmenting(key);

      // Calculate stats
      const rawWords = text.match(/\p{L}+/gu) || [];
      const words = Array.from(new Set(rawWords));
      const filtered = words.filter((w) => !state.deletedWords.includes(w));
      const total = filtered.length;
      const knownVals = ["1", "2", "3", "known"];
      const seen = filtered.filter((w) =>
        knownVals.includes(state.wordMetadata[w]?.fam),
      ).length;
      const known = filtered.filter(
        (w) => state.wordMetadata[w]?.fam === "known",
      ).length;
      const unknown = total - seen;
      const pct = total ? Math.round((unknown / total) * 100) : 0;
      const progress = total ? (known / total) * 100 : 0;

      return (
        <div
          key={key}
          className={`lesson-card rounded-xl cursor-pointer relative transition-all duration-300 hover:scale-105 origin-top-left w-64 min-h-32 overflow-hidden ${
            isSegmenting ? "bg-gray-100 opacity-75" : "bg-white opacity-100"
          }`}
          style={{
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            borderLeft: isSegmenting
              ? "4px solid #9CA3AF"
              : "4px solid #8B5CF6",
          }}
          onClick={() => !isSegmenting && navigate(`/lesson/${key}`)}
        >
          <div
            className={`px-4 py-3 border-b border-gray-100 ${
              isSegmenting
                ? "bg-gradient-to-r from-gray-50 to-gray-100"
                : "bg-gradient-to-r from-purple-50 to-pink-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3
                className={`text-lg font-semibold ${isSegmenting ? "text-gray-600" : "text-gray-800"}`}
              >
                {key}
              </h3>
              {isSegmenting && (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                  <span className="text-xs text-gray-500">Processing...</span>
                </div>
              )}
            </div>
            <div className="absolute top-2 right-2">
              <button
                className="edit-lesson bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full text-gray-600 transition-colors relative"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(openDropdown === key ? null : key);
                }}
              >
                ⋮
              </button>
              {openDropdown === key && (
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-32">
                  <button
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-t-lg flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(null);
                      navigate(`/edit/${key}`);
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-b-lg flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(null);
                      deleteLesson(key);
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="p-4">
            {isSegmenting ? (
              <div className="text-center">
                <span className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium mb-3">
                  🔤 Optimizing Text...
                </span>
                <div className="text-xs text-gray-500">
                  This lesson is being processed for better word recognition. It
                  will be available soon!
                </div>
              </div>
            ) : (
              <>
                <span className="unknown-percent inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium mb-3">
                  {pct}% unknown
                </span>
                <div className="progress-bar bg-gray-200 h-2 rounded-full">
                  <div
                    className="progress bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </>
            )}
          </div>
        </div>
      );
    });
  };

  const deleteLesson = (key) => {
    setConfirmDelete({ isOpen: true, lessonKey: key });
  };

  const handleConfirmDelete = async () => {
    const key = confirmDelete.lessonKey;
    const newLessons = { ...state.lessons };
    const newCategories = { ...state.lessonCategories };
    const newRecentLessons = (state.recentlyAccessedLessons || []).filter(
      (lesson) => lesson !== key,
    );

    delete newLessons[key];
    delete newCategories[key];

    const newState = {
      ...state,
      lessons: newLessons,
      lessonCategories: newCategories,
      recentlyAccessedLessons: newRecentLessons,
    };

    setState(newState);
    await StorageManager.save(newState);
    setConfirmDelete({ isOpen: false, lessonKey: null });
  };

  const handleCancelDelete = () => {
    setConfirmDelete({ isOpen: false, lessonKey: null });
  };

  const renderCategorySection = (category, color, gradient) => {
    const categoryLessons = getLessonsForCategory(category);

    if (categoryLessons.length === 0) return null;

    return (
      <div
        key={category}
        className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden"
        style={{
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div
          className={`bg-gradient-to-r ${gradient} px-6 py-3 border-b border-gray-100`}
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#374151",
            borderLeft: `4px solid ${color}`,
          }}
        >
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </div>
        <div className="p-6">
          <div
            className="flex gap-4 overflow-x-auto pb-2"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#D1D5DB #F3F4F6",
            }}
          >
            {renderLessonCards(categoryLessons)}
          </div>
        </div>
      </div>
    );
  };

  const getCategoryStyle = (category) => {
    const styles = {
      news: { color: "#DC2626", gradient: "from-red-50 to-rose-50" },
      hobbies: { color: "#7C3AED", gradient: "from-purple-50 to-violet-50" },
      food: { color: "#EA580C", gradient: "from-orange-50 to-amber-50" },
      movies: { color: "#7C2D12", gradient: "from-amber-50 to-yellow-50" },
      books: { color: "#059669", gradient: "from-emerald-50 to-teal-50" },
      travel: { color: "#2563EB", gradient: "from-blue-50 to-cyan-50" },
    };
    return (
      styles[category] || {
        color: "#6B7280",
        gradient: "from-gray-50 to-slate-50",
      }
    );
  };

  return (
    <div
      className="container mx-auto overflow-visible"
      style={{ margin: "0 auto 200px", padding: "16px 16px 0" }}
    >
      <h2 className="text-2xl font-bold mb-6 overflow-visible">
        📖 My Lessons
      </h2>

      {/* Recently studied section */}
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
          Recently studied
        </div>
        <div className="p-6">
          <div
            className="flex gap-4 overflow-x-auto pb-2"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#D1D5DB #F3F4F6",
            }}
          >
            {getRecentlyStudiedLessons().length > 0
              ? renderLessonCards(
                  getRecentlyStudiedLessons()
                    .map((key) => [key, state.lessons[key]])
                    .filter(([key, text]) => text),
                )
              : renderLessonCards(Object.entries(state.lessons).slice(0, 5))}
          </div>
        </div>
      </div>

      {/* Recently accessed categories at the top */}
      {state.recentlyAccessedCategories?.slice(0, 3).map((category) => {
        const style = getCategoryStyle(category);
        return renderCategorySection(category, style.color, style.gradient);
      })}

      {/* Themed category sections */}
      {categories
        .filter(
          (category) =>
            !state.recentlyAccessedCategories?.slice(0, 3).includes(category),
        )
        .map((category) => {
          const style = getCategoryStyle(category);
          return renderCategorySection(category, style.color, style.gradient);
        })}

      {/* History section */}
      <div
        className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden"
        style={{
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div
          className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-3 border-b border-gray-100"
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#374151",
            borderLeft: "4px solid #6B7280",
          }}
        >
          All Lessons
        </div>
        <div className="p-6">
          <div
            className="flex gap-4 overflow-x-auto pb-2"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#D1D5DB #F3F4F6",
            }}
          >
            {renderLessonCards()}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmDelete.isOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete Lesson"
        message={`Are you sure you want to delete "${confirmDelete.lessonKey}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default LibraryView;
