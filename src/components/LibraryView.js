import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import AppContext from "../context/AppContext";
import { StorageManager } from "../storageManager";

const LibraryView = () => {
  const { state, setState } = useContext(AppContext);
  const navigate = useNavigate();

  const renderLessonCards = () => {
    return Object.entries(state.lessons).map(([key, text]) => {
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
          className="lesson-card bg-secondary text-white p-4 rounded-lg cursor-pointer relative opacity-100 transition-all duration-300 hover:scale-105 origin-top-left hover:shadow-md w-64 min-h-32"
          onClick={() => navigate(`/lesson/${key}`)}
        >
          <h3 className="text-lg font-bold">{key}</h3>
          <button className="edit-lesson absolute top-2 right-2 bg-gray-600 px-2 py-1 rounded-full text-white">
            ⋮
          </button>
          {/* Card menu would be added here with state for show/hide */}
          <span className="unknown-percent absolute bottom-8 right-4 bg-white bg-opacity-20 px-2 py-1 rounded text-sm">
            {pct}% unknown
          </span>
          <div className="progress-bar bg-gray-300 h-2 rounded absolute bottom-4 left-0 right-0 mx-4">
            <div
              className="progress bg-primary h-full rounded"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      );
    });
  };

  const deleteLesson = async (key) => {
    if (window.confirm("Delete this lesson?")) {
      const newLessons = { ...state.lessons };
      delete newLessons[key];
      setState((prev) => ({ ...prev, lessons: newLessons }));
      await StorageManager.save(state);
    }
  };

  // Add edit logic similarly

  return (
    <div
      className="container mx-auto overflow-visible"
      style={{ margin: "0 auto 200px", padding: "16px 16px 0" }}
    >
      <h2 className="text-2xl font-bold mb-4 overflow-visible">
        📖 My Lessons
      </h2>

      <div style={{ position: "relative", marginTop: "20px", height: "30px" }}>
        Recently studied
      </div>

      <div
        className="flex gap-4 overflow-x-auto pb-4 overflow-visible"
        style={{ marginBottom: "3px" }}
      >
        {renderLessonCards()}
      </div>

      <div style={{ position: "relative", marginTop: "20px", height: "30px" }}>
        History
      </div>

      <div
        className="flex gap-4 overflow-x-auto pb-4 overflow-visible"
        style={{ marginBottom: "3px" }}
      >
        {renderLessonCards()}
      </div>
    </div>
  );
};

export default LibraryView;
