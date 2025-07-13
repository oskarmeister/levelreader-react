import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppContext from "../context/AppContext";

const LessonView = () => {
  const { state, setState } = useContext(AppContext);
  const { key } = useParams();
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [wordsPerPage, setWordsPerPage] = useState(300);
  const [allWords, setAllWords] = useState([]);
  const [selectedWordIndex, setSelectedWordIndex] = useState(-1);

  useEffect(() => {
    const text = state.lessons[key];
    if (text) {
      setState((prev) => {
        // Track recently accessed lesson
        const updatedRecentLessons = [
          key,
          ...(prev.recentlyAccessedLessons || []).filter(
            (lesson) => lesson !== key,
          ),
        ].slice(0, 10);

        // Track recently accessed categories
        const lessonCategories = prev.lessonCategories?.[key] || [];
        const updatedRecentCategories = lessonCategories
          .reduce((acc, category) => {
            return [category, ...acc.filter((cat) => cat !== category)];
          }, prev.recentlyAccessedCategories || [])
          .slice(0, 5);

        return {
          ...prev,
          currentText: text,
          recentlyAccessedLessons: updatedRecentLessons,
          recentlyAccessedCategories: updatedRecentCategories,
        };
      });

      calculateWordsPerPage();
    }
  }, [key, state.wordMetadata, state.deletedWords]);

  useEffect(() => {
    const handleResize = () => {
      calculateWordsPerPage();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Page navigation with Shift + Arrow keys
      if (e.shiftKey && e.key === "ArrowRight" && pages.length > 1) {
        e.preventDefault();
        setCurrentPage(Math.min(pages.length - 1, currentPage + 1));
        return;
      }
      if (e.shiftKey && e.key === "ArrowLeft" && pages.length > 1) {
        e.preventDefault();
        setCurrentPage(Math.max(0, currentPage - 1));
        return;
      }

      // Word navigation with Arrow keys (no shift)
      if (!e.shiftKey && e.key === "ArrowRight" && allWords.length > 0) {
        e.preventDefault();
        const nextIndex = Math.min(allWords.length - 1, selectedWordIndex + 1);
        setSelectedWordIndex(nextIndex);
        handleWordSelect(allWords[nextIndex]);
        return;
      }
      if (!e.shiftKey && e.key === "ArrowLeft" && allWords.length > 0) {
        e.preventDefault();
        const prevIndex = Math.max(0, selectedWordIndex - 1);
        setSelectedWordIndex(prevIndex);
        handleWordSelect(allWords[prevIndex]);
        return;
      }

      // Familiarity level shortcuts
      if (state.selectedWord) {
        let famLevel = null;
        switch (e.key) {
          case "1":
            famLevel = "1";
            break;
          case "2":
            famLevel = "2";
            break;
          case "3":
            famLevel = "3";
            break;
          case "k":
          case "K":
            famLevel = "known";
            break;
        }

        if (famLevel) {
          e.preventDefault();
          handleFamiliarityChange(state.selectedWord, famLevel);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentPage,
    pages.length,
    allWords,
    selectedWordIndex,
    state.selectedWord,
  ]);

  const calculateWordsPerPage = () => {
    // Calculate available height for text content more accurately
    const navHeight = 64; // Navigation bar height (pt-16)
    const backButtonHeight = 48; // Back button with margin
    const headerSectionHeight = 100; // Lesson header card section
    const cardPadding = 64; // Card internal padding (p-8 = 32px top + 32px bottom)
    const legendHeight = 140; // Word legend section with margin
    const paginationHeight = 80; // Pagination controls
    const containerPadding = 32; // Container padding
    const margin = 48; // Additional safe margin

    const totalFixedHeight =
      navHeight +
      backButtonHeight +
      headerSectionHeight +
      cardPadding +
      legendHeight +
      paginationHeight +
      containerPadding +
      margin;
    const availableHeight = Math.max(
      300,
      window.innerHeight - totalFixedHeight,
    );

    // Estimate words that can fit based on line height and font size
    const lineHeight = 29.25; // From CSS: line-height for text-lg (1.625 * 18px)
    const wordsPerLine = 10; // Conservative estimate of words per line
    const linesPerPage = Math.floor(availableHeight / lineHeight);
    const calculatedWordsPerPage = Math.max(200, linesPerPage * wordsPerLine); // Minimum 200 words for better space usage

    setWordsPerPage(calculatedWordsPerPage);

    // Re-paginate text with new word count
    const text = state.lessons[key];
    if (text) {
      paginateText(text, calculatedWordsPerPage);
    }
  };

  const paginateText = (text, customWordsPerPage = wordsPerPage) => {
    const words = text.match(/\p{L}+|\p{P}+|\s+/gu) || [];
    const pagesList = [];

    // Extract just the actual words for navigation
    const wordsList = [];
    words.forEach((token) => {
      if (/\p{L}+/u.test(token)) {
        const word = token.toLowerCase();
        if (!state.deletedWords.includes(word)) {
          wordsList.push(word);
        }
      }
    });
    setAllWords(wordsList);

    // Split words into pages
    for (let i = 0; i < words.length; i += customWordsPerPage) {
      const pageWords = words.slice(i, i + customWordsPerPage);
      const renderedPage = pageWords.map((token, index) => {
        const globalIndex = i + index; // Use global index for unique keys

        if (/\p{L}+/u.test(token)) {
          const word = token.toLowerCase();
          const metadata = state.wordMetadata[word];
          const isDeleted = state.deletedWords.includes(word);

          if (isDeleted) return null;

          const isSelected = state.selectedWord === word;
          let className =
            "cursor-pointer transition-all hover:bg-gray-200 px-1 rounded ";

          // Add selected word styling
          if (isSelected) {
            className +=
              "text-xl font-bold ring-2 ring-blue-500 ring-offset-1 ";
          }

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
          <div
            className="prose prose-lg max-w-none leading-relaxed text-lg"
            style={{
              height: "300px",
              overflow: "hidden",
            }}
          >
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
