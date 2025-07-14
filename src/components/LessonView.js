import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppContext from "../context/AppContext";
import TranslationService from "../services/translationService";
import { getLanguageCode } from "../utils/languageUtils";

const LessonView = () => {
  const { state, setState } = useContext(AppContext);
  const { key } = useParams();
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [wordsPerPage, setWordsPerPage] = useState(300);
  const [allWords, setAllWords] = useState([]);
  const [selectedWordIndex, setSelectedWordIndex] = useState(-1);
  const [viewMode, setViewMode] = useState("words"); // "words" or "sentences"
  const [sentences, setSentences] = useState([]);
  const [currentSentence, setCurrentSentence] = useState(0);
  const [sentenceTranslation, setSentenceTranslation] = useState("");
  const [translatingsentence, setTranslatingsentence] = useState(false);

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
      parseSentences(text);
    }
  }, [key, state.wordMetadata, state.deletedWords, state.selectedWord]);

  useEffect(() => {
    const handleResize = () => {
      calculateWordsPerPage();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Navigation based on view mode
      if (viewMode === "sentences") {
        // Sentence navigation with Shift + Arrow keys
        if (e.shiftKey && e.key === "ArrowRight" && sentences.length > 1) {
          e.preventDefault();
          setCurrentSentence(
            Math.min(sentences.length - 1, currentSentence + 1),
          );
          setSentenceTranslation("");
          return;
        }
        if (e.shiftKey && e.key === "ArrowLeft" && sentences.length > 1) {
          e.preventDefault();
          setCurrentSentence(Math.max(0, currentSentence - 1));
          setSentenceTranslation("");
          return;
        }

        // Word navigation within current sentence with Arrow keys (no shift)
        if (!e.shiftKey && e.key === "ArrowRight") {
          e.preventDefault();
          const sentenceWords = getSentenceWords(sentences[currentSentence]);
          if (sentenceWords.length > 0) {
            const currentWordIndex = sentenceWords.indexOf(state.selectedWord);
            const nextIndex =
              currentWordIndex >= 0
                ? Math.min(sentenceWords.length - 1, currentWordIndex + 1)
                : 0;
            handleWordSelect(sentenceWords[nextIndex]);
          }
          return;
        }
        if (!e.shiftKey && e.key === "ArrowLeft") {
          e.preventDefault();
          const sentenceWords = getSentenceWords(sentences[currentSentence]);
          if (sentenceWords.length > 0) {
            const currentWordIndex = sentenceWords.indexOf(state.selectedWord);
            const prevIndex =
              currentWordIndex >= 0
                ? Math.max(0, currentWordIndex - 1)
                : sentenceWords.length - 1;
            handleWordSelect(sentenceWords[prevIndex]);
          }
          return;
        }
      } else {
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

        // Word navigation with Arrow keys (no shift) in page mode
        if (!e.shiftKey && e.key === "ArrowRight" && allWords.length > 0) {
          e.preventDefault();
          const nextIndex = Math.min(
            allWords.length - 1,
            selectedWordIndex + 1,
          );
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

      // Ignore word with 'x' key
      if (state.selectedWord && (e.key === "x" || e.key === "X")) {
        e.preventDefault();
        handleIgnoreWord(state.selectedWord);
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
    viewMode,
    sentences.length,
    currentSentence,
  ]);

  const parseSentences = (text) => {
    // Split text into sentences using multiple sentence delimiters
    const sentenceRegex = /[.!?]+\s*/g;
    const sentenceList = text
      .split(sentenceRegex)
      .filter((sentence) => sentence.trim().length > 0);
    setSentences(sentenceList);
    setCurrentSentence(0);
    setSentenceTranslation("");
  };

  const translateSentence = async (sentence) => {
    setTranslatingsentence(true);
    setSentenceTranslation("");

    try {
      const sourceLang = getLanguageCode(state.selectedLanguage);
      const result = await TranslationService.translateText(
        sentence,
        "en",
        sourceLang,
      );
      setSentenceTranslation(result.translatedText);
    } catch (error) {
      setSentenceTranslation("Translation failed. Please try again.");
      console.error("Translation error:", error);
    } finally {
      setTranslatingsentence(false);
    }
  };

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
          const isIgnored = state.deletedWords.includes(word);

          // If word is ignored, show it without any highlighting
          if (isIgnored) {
            return (
              <span key={globalIndex} className="text-gray-800">
                {token}
              </span>
            );
          }

          const isSelected = state.selectedWord === word;
          let className =
            "cursor-pointer transition-all hover:bg-gray-200 px-1 rounded ";

          // Add selected word styling
          if (isSelected) {
            className += "ring-2 ring-blue-500 ring-offset-1 ";
          }

          if (metadata?.fam === "known") {
            className += "text-gray-800"; // known words
          } else if (metadata?.fam === "3") {
            className += "text-green-600 bg-green-50"; // very familiar
          } else if (metadata?.fam === "2") {
            className += "text-yellow-600 bg-yellow-50"; // familiar
          } else if (metadata?.fam === "1") {
            className += "text-orange-600 bg-orange-50"; // new
          } else if (!metadata) {
            className += "text-red-600 bg-red-50 font-medium"; // unknown words - never seen before
          } else {
            className += "text-gray-800"; // fallback for other cases
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
    const wordIndex = allWords.indexOf(word);
    setSelectedWordIndex(wordIndex);
    handleWordSelect(word);
  };

  const handleWordSelect = (word) => {
    setState((prev) => ({
      ...prev,
      sidebarOpen: true,
      selectedWord: word,
    }));
  };

  const handleFamiliarityChange = async (word, famLevel) => {
    const currentTranslation =
      state.wordMetadata[word]?.translation ||
      state.translationCache[word] ||
      "";
    const newMetadata = {
      ...state.wordMetadata,
      [word]: { translation: currentTranslation, fam: famLevel },
    };
    setState((prev) => ({ ...prev, wordMetadata: newMetadata }));
    // Save would be handled by the storage manager
  };

  const handleIgnoreWord = (word) => {
    setState((prev) => {
      const newWordMetadata = { ...prev.wordMetadata };
      // Remove word metadata and add to ignored words list
      delete newWordMetadata[word];

      return {
        ...prev,
        wordMetadata: newWordMetadata,
        deletedWords: [...prev.deletedWords, word], // Add to ignored list
        selectedWord: "", // Clear selection
        sidebarOpen: false, // Close sidebar
      };
    });
  };

  const getSentenceWords = (sentence) => {
    if (!sentence) return [];
    const words = sentence.match(/\p{L}+|\p{P}+|\s+/gu) || [];
    return words
      .filter((token) => /\p{L}+/u.test(token))
      .map((token) => token.toLowerCase())
      .filter((word) => !state.deletedWords.includes(word)); // Only exclude ignored words from navigation
  };

  const renderSentenceWithClickableWords = (sentence) => {
    if (!sentence) return null;

    const words = sentence.match(/\p{L}+|\p{P}+|\s+/gu) || [];

    return words.map((token, index) => {
      if (/\p{L}+/u.test(token)) {
        const word = token.toLowerCase();
        const metadata = state.wordMetadata[word];
        const isIgnored = state.deletedWords.includes(word);

        // If word is ignored, show it without any highlighting
        if (isIgnored) {
          return (
            <span key={index} className="text-gray-800">
              {token}
            </span>
          );
        }

        const isSelected = state.selectedWord === word;
        let className =
          "cursor-pointer transition-all hover:bg-gray-200 px-1 rounded ";

        // Add selected word styling
        if (isSelected) {
          className += "ring-2 ring-blue-500 ring-offset-1 ";
        }

        if (metadata?.fam === "known") {
          className += "text-gray-800"; // known words
        } else if (metadata?.fam === "3") {
          className += "text-green-600 bg-green-50"; // very familiar
        } else if (metadata?.fam === "2") {
          className += "text-yellow-600 bg-yellow-50"; // familiar
        } else if (metadata?.fam === "1") {
          className += "text-orange-600 bg-orange-50"; // new
        } else if (!metadata) {
          className += "text-red-600 bg-red-50 font-medium"; // unknown words - never seen before
        } else {
          className += "text-gray-800"; // fallback for other cases
        }

        return (
          <span
            key={index}
            className={className}
            onClick={() => handleWordClick(word)}
          >
            {token}
          </span>
        );
      }
      return <span key={index}>{token}</span>;
    });
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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{key}</h1>
              <p className="text-gray-600 mt-2">
                {viewMode === "words"
                  ? "Click on words to view and save translations"
                  : "Read sentences one at a time with translation"}
              </p>
            </div>
            <div className="flex bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setViewMode("words")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "words"
                    ? "bg-purple-600 text-white"
                    : "text-gray-600 hover:text-purple-600"
                }`}
              >
                Page
              </button>
              <button
                onClick={() => setViewMode("sentences")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "sentences"
                    ? "bg-purple-600 text-white"
                    : "text-gray-600 hover:text-purple-600"
                }`}
              >
                Sentence
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {viewMode === "words" ? (
            <div
              className="prose prose-lg max-w-none leading-relaxed text-lg"
              style={{
                height: "300px",
                overflow: "hidden",
              }}
            >
              {pages[currentPage] || []}
            </div>
          ) : (
            <div className="min-h-[400px]">
              <div className="mb-8">
                <div className="text-2xl leading-relaxed mb-6 p-6 bg-gray-50 rounded-lg">
                  {renderSentenceWithClickableWords(
                    sentences[currentSentence],
                  ) || "No sentence available"}
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-600">
                    Sentence {currentSentence + 1} of {sentences.length}
                  </span>
                  <button
                    onClick={() =>
                      translateSentence(sentences[currentSentence])
                    }
                    disabled={
                      translatingsentence || !sentences[currentSentence]
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {translatingsentence
                      ? "Translating..."
                      : "Translate to English"}
                  </button>
                </div>

                {sentenceTranslation && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm text-green-600 font-medium mb-1">
                      Translation:
                    </div>
                    <div className="text-green-800">{sentenceTranslation}</div>
                  </div>
                )}
              </div>

              {sentences.length > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setCurrentSentence(Math.max(0, currentSentence - 1));
                      setSentenceTranslation("");
                    }}
                    disabled={currentSentence === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Previous
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 mr-2">
                      {currentSentence + 1} / {sentences.length}
                    </span>
                    <div className="flex gap-1">
                      {sentences.length <= 10 ? (
                        // Show all buttons if 10 or fewer sentences
                        sentences.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setCurrentSentence(index);
                              setSentenceTranslation("");
                            }}
                            className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                              index === currentSentence
                                ? "bg-purple-600 text-white"
                                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                            }`}
                          >
                            {index + 1}
                          </button>
                        ))
                      ) : (
                        // Show limited buttons with ellipsis for many sentences
                        <>
                          {currentSentence > 2 && (
                            <>
                              <button
                                onClick={() => {
                                  setCurrentSentence(0);
                                  setSentenceTranslation("");
                                }}
                                className="w-8 h-8 rounded-full text-sm font-medium bg-gray-200 text-gray-600 hover:bg-gray-300"
                              >
                                1
                              </button>
                              <span className="text-gray-400">...</span>
                            </>
                          )}

                          {Array.from({ length: 5 }, (_, i) => {
                            const index =
                              Math.max(
                                0,
                                Math.min(
                                  sentences.length - 5,
                                  currentSentence - 2,
                                ),
                              ) + i;
                            if (index >= sentences.length) return null;
                            return (
                              <button
                                key={index}
                                onClick={() => {
                                  setCurrentSentence(index);
                                  setSentenceTranslation("");
                                }}
                                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                                  index === currentSentence
                                    ? "bg-purple-600 text-white"
                                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                }`}
                              >
                                {index + 1}
                              </button>
                            );
                          })}

                          {currentSentence < sentences.length - 3 && (
                            <>
                              <span className="text-gray-400">...</span>
                              <button
                                onClick={() => {
                                  setCurrentSentence(sentences.length - 1);
                                  setSentenceTranslation("");
                                }}
                                className="w-8 h-8 rounded-full text-sm font-medium bg-gray-200 text-gray-600 hover:bg-gray-300"
                              >
                                {sentences.length}
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCurrentSentence(
                        Math.min(sentences.length - 1, currentSentence + 1),
                      );
                      setSentenceTranslation("");
                    }}
                    disabled={currentSentence === sentences.length - 1}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}

          {viewMode === "words" && pages.length > 1 && (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <span>New (Level 1)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded"></span>
              <span>Familiar (Level 2)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-50 border border-green-200 rounded"></span>
              <span>Very Familiar (Level 3)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></span>
              <span>Known words</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            Keyboard Shortcuts
          </h3>
          <div className="space-y-2 text-sm">
            {viewMode === "words" ? (
              <>
                <div className="flex justify-between">
                  <span>Navigate words:</span>
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    ← →
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Change pages:</span>
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    Shift + ← →
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Set familiarity:</span>
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    1, 2, 3, K
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ignore word:</span>
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    X
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>Navigate words:</span>
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    ← →
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Navigate sentences:</span>
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    Shift + ← ��
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Set familiarity:</span>
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    1, 2, 3, K
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ignore word:</span>
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    X
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonView;
