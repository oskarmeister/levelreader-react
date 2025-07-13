import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppContext from "../context/AppContext";

const LessonView = () => {
  const { state, setState } = useContext(AppContext);
  const { key } = useParams();
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);

  const WORDS_PER_PAGE = 100; // Adjust this to control page size

  useEffect(() => {
    const text = state.lessons[key];
    if (text) {
      setState((prev) => ({ ...prev, currentText: text }));
      paginateText(text);
    }
  }, [key, state.wordMetadata, state.deletedWords]);

  const paginateText = (text) => {
    const words = text.match(/\p{L}+|\p{P}+|\s+/gu) || [];
    const pagesList = [];

    // Split words into pages
    for (let i = 0; i < words.length; i += WORDS_PER_PAGE) {
      const pageWords = words.slice(i, i + WORDS_PER_PAGE);
      const renderedPage = pageWords.map((token, index) => {
        const globalIndex = i + index; // Use global index for unique keys

        if (/\p{L}+/u.test(token)) {
          const word = token.toLowerCase();
          const metadata = state.wordMetadata[word];
          const isDeleted = state.deletedWords.includes(word);

          if (isDeleted) return null;

          let className =
            "cursor-pointer transition-colors hover:bg-gray-200 px-1 rounded ";

          if (metadata?.fam === "known") {
            className += "text-gray-800"; // unmarked, normal text color
          } else if (metadata?.fam === "3") {
            className += "text-green-600 bg-green-50";
          } else if (metadata?.fam === "2") {
            className += "text-yellow-600 bg-yellow-50";
          } else if (metadata?.fam === "1") {
            className += "text-orange-600 bg-orange-50";
          } else {
            className += "text-red-600 bg-red-50 font-medium";
          }

          return (
            <span
              key={globalIndex}
              className={className}
              onClick={() => handleWordClick(word)}
            >
              {token}
            </span>
          );
        }
        return <span key={globalIndex}>{token}</span>;
      });

      pagesList.push(renderedPage);
    }

    setPages(pagesList);
    setCurrentPage(0); // Reset to first page when text changes
  };

  const handleWordClick = (word) => {
    setState((prev) => ({
      ...prev,
      sidebarOpen: true,
      selectedWord: word,
    }));
  };

  if (!state.lessons[key]) {
    return (
      <div className="container mx-auto p-4">
        <button
          onClick={() => navigate("/library")}
          className="mb-4 text-primary"
        >
          ← Back
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Lesson not found</h2>
          <p>The lesson "{key}" does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 relative max-w-4xl">
      <button
        onClick={() => navigate("/library")}
        className="mb-6 text-primary hover:text-primary-dark transition-colors flex items-center gap-2"
      >
        ← Back to Library
      </button>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        <div
          className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100"
          style={{ borderLeft: "4px solid #8B5CF6" }}
        >
          <h1 className="text-3xl font-bold text-gray-800">{key}</h1>
          <p className="text-gray-600 mt-2">
            Click on words to view and save translations
          </p>
        </div>

        <div className="p-8">
          <div className="prose prose-lg max-w-none leading-relaxed text-lg min-h-[400px]">
            {pages[currentPage] || []}
          </div>

          {pages.length > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Page {currentPage + 1} of {pages.length}
                </span>
                <div className="flex gap-1">
                  {pages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index)}
                      className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                        index === currentPage
                          ? "bg-purple-600 text-white"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(pages.length - 1, currentPage + 1))
                }
                disabled={currentPage === pages.length - 1}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">
          Word Legend
        </h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-red-50 border border-red-200 rounded"></span>
            <span>Unknown words</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-orange-50 border border-orange-200 rounded"></span>
            <span>Learning (Level 1)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded"></span>
            <span>Familiar (Level 2)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-green-50 border border-green-200 rounded"></span>
            <span>Well Known (Level 3)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></span>
            <span>Known words</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonView;
