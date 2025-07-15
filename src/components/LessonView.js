import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppContext from "../context/AppContext";
import TranslationService from "../services/translationService";
import ChineseSegmentationService from "../services/chineseSegmentationService";
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
  const [renderedSentence, setRenderedSentence] = useState(null);

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

      const initializeText = async () => {
        await calculateWordsPerPage();
        parseSentences(text);
      };
      initializeText();
    }
  }, [key, state.wordMetadata, state.deletedWords, state.selectedWord]);

  useEffect(() => {
    const handleResize = async () => {
      await calculateWordsPerPage();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Effect to render sentence when it changes
  useEffect(() => {
    const renderCurrentSentence = async () => {
      if (sentences[currentSentence]) {
        const rendered = await renderSentenceWithClickableWords(
          sentences[currentSentence],
        );
        setRenderedSentence(rendered);
      }
    };

    renderCurrentSentence();
  }, [
    currentSentence,
    sentences,
    state.selectedLanguage,
    state.wordMetadata,
    state.deletedWords,
    state.selectedWord,
  ]);

  // Set up segmentation completion callback for automatic word updates
  useEffect(() => {
    if (state.selectedLanguage === "Chinese") {
      const handleSegmentationComplete = (pageNumber) => {
        console.log(
          `🔄 CALLBACK: Segmentation completed for page ${pageNumber}, current page is ${currentPage}`,
        );

        // If the completed page is the current page, update the words
        if (pageNumber === currentPage) {
          console.log(
            `✨ CALLBACK: Current page ${currentPage} segmentation completed, updating words automatically`,
          );

          // Re-paginate the current text to incorporate new segmentation
          const text = state.lessons[key];
          if (text) {
            console.log(
              `📝 CALLBACK: Starting updateCurrentPageWords for text length ${text.length}`,
            );
            // Update words with the new segmentation
            updateCurrentPageWords(text);
          } else {
            console.log(`❌ CALLBACK: No text available for key ${key}`);
          }
        } else {
          console.log(
            `ℹ️ CALLBACK: Page ${pageNumber} completed but current page is ${currentPage}, skipping update`,
          );
        }
      };

      // Register the callback
      ChineseSegmentationService.setSegmentationCompleteCallback(
        handleSegmentationComplete,
      );

      // Cleanup callback on unmount or language change
      return () => {
        ChineseSegmentationService.setSegmentationCompleteCallback(null);
      };
    }
  }, [state.selectedLanguage, currentPage, key, state.lessons]);

  // Handle page changes for Chinese text background segmentation
  useEffect(() => {
    if (
      state.selectedLanguage === "Chinese" &&
      state.lessons[key] &&
      currentPage >= 0
    ) {
      console.log(
        `📖 Page changed to ${currentPage}, updating segmentation system`,
      );

      // Update current page in segmentation service and trigger background work
      ChineseSegmentationService.setCurrentPage(currentPage);

      // Log current segmentation status
      const progress = ChineseSegmentationService.getSegmentationProgress();
      console.log(
        `🔄 Segmentation progress: ${progress.completed}/${progress.total} pages (${progress.percentage}%)`,
      );

      const areCurrentPagesReady =
        ChineseSegmentationService.areCurrentPagesSegmented();
      console.log(`✨ Current + next pages segmented: ${areCurrentPagesReady}`);
    }
  }, [currentPage, state.selectedLanguage, state.lessons, key, wordsPerPage]);

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

  const calculateWordsPerPage = async () => {
    // Changed to character-based pagination with maximum 150 characters per page
    const maxCharsPerPage = 150;
    setWordsPerPage(maxCharsPerPage);

    // Re-paginate text with new character count
    const text = state.lessons[key];
    if (text) {
      await paginateText(text, maxCharsPerPage);
    }
  };

  const paginateText = async (text, maxCharsPerPage = wordsPerPage) => {
    // Character-based pagination (customWordsPerPage now represents max chars per page)
    console.log(
      `🔤 Paginating text using character-based pagination: ${maxCharsPerPage} chars per page`,
    );

    // For Chinese text, set up background segmentation system
    if (state.selectedLanguage === "Chinese") {
      console.log(
        "🚀 Setting up Chinese text with immediate rendering + background segmentation",
      );

      // Calculate total pages for character-based tracking
      const totalPages = Math.ceil(text.length / maxCharsPerPage);

      // Initialize page tracking system
      ChineseSegmentationService.initializePageTracking(
        totalPages,
        maxCharsPerPage,
      );

      // Store text for background segmentation
      ChineseSegmentationService.currentText = text;

      // Set current page and start background segmentation
      ChineseSegmentationService.setCurrentPage(currentPage);

      console.log(
        `📄 Character-based pagination: ${text.length} chars across ${totalPages} pages (${maxCharsPerPage} chars/page)`,
      );
    }

    const pagesList = [];
    const allWordsList = [];

    // Split text into character-based pages
    for (let i = 0; i < text.length; i += maxCharsPerPage) {
      const pageText = text.substring(i, i + maxCharsPerPage);

      // Tokenize the page text for display
      const tokens = pageText.match(/\p{L}+|\p{P}+|\s+/gu) || [];

      // Collect words from this page for navigation
      tokens.forEach((token) => {
        if (/\p{L}+/u.test(token)) {
          const word = token.toLowerCase();
          if (!state.deletedWords.includes(word)) {
            allWordsList.push(word);
          }
        }
      });

      // Render the page tokens
      const renderedPage = tokens.map((token, index) => {
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
            className += "ring-2 ring-blue-500 ring-offset-1 ";
          }

          if (metadata?.fam === "known") {
            className += "text-gray-800"; // known words, normal text color
          } else if (metadata?.fam === "ignored") {
            className += "text-gray-600"; // ignored words, muted text color
          } else if (!metadata) {
            className += "text-red-600 bg-red-50 font-medium"; // unknown words, red highlighting
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

    setAllWords(allWordsList);
    setPages(pagesList);
    setCurrentPage(0); // Reset to first page when text changes
  };

  const updateCurrentPageWords = async (text) => {
    if (state.selectedLanguage !== "Chinese") {
      return; // Only applies to Chinese text
    }

    console.log(
      `🔄 Updating current page ${currentPage} with improved segmentation`,
    );

    // Get improved segmentation for current page
    const improvedSegmentation =
      ChineseSegmentationService.getPageSegmentation(currentPage);

    if (!improvedSegmentation) {
      console.log(`No improved segmentation found for page ${currentPage}`);
      return;
    }

    console.log(
      `Found improved segmentation for page ${currentPage}: ${improvedSegmentation.length} segments`,
    );

    // Calculate text for current page using character-based pagination
    const maxCharsPerPage = wordsPerPage; // wordsPerPage now represents chars per page
    const startIndex = currentPage * maxCharsPerPage;
    const endIndex = Math.min((currentPage + 1) * maxCharsPerPage, text.length);
    const pageText = text.substring(startIndex, endIndex);

    console.log(
      `Page ${currentPage} text length: ${pageText.length}, segmentation covers: ${improvedSegmentation[improvedSegmentation.length - 1]?.end || 0}`,
    );

    // Convert segmentation back to tokens for display
    const improvedTokens = [];

    // Use the segmentation data to rebuild tokens
    for (const segment of improvedSegmentation) {
      improvedTokens.push(segment.word);
    }

    console.log(
      `Generated ${improvedTokens.length} improved tokens from segmentation`,
    );

    // Re-render current page with improved tokens
    const renderedPage = improvedTokens.map((token, index) => {
      const globalIndex = startIndex + index; // Use global index for unique keys

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
          className += "ring-2 ring-blue-500 ring-offset-1 ";
        }

        if (metadata?.fam === "known") {
          className += "text-gray-800"; // known words, normal text color
        } else if (metadata?.fam === "ignored") {
          className += "text-gray-600"; // ignored words, muted text color
        } else if (!metadata) {
          className += "text-red-600 bg-red-50 font-medium"; // unknown words, red highlighting
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
            key={`improved-${globalIndex}`}
            className={className}
            onClick={() => handleWordClick(word)}
          >
            {token}
          </span>
        );
      }
      return <span key={`improved-${globalIndex}`}>{token}</span>;
    });

    // Update only the current page in the pages array
    setPages((prevPages) => {
      const newPages = [...prevPages];
      newPages[currentPage] = renderedPage;
      return newPages;
    });

    // Update allWords list with improved segmentation
    const improvedWordsList = [];
    improvedTokens.forEach((token) => {
      if (/\p{L}+/u.test(token)) {
        const word = token.toLowerCase();
        if (!state.deletedWords.includes(word)) {
          improvedWordsList.push(word);
        }
      }
    });

    // For character-based pagination, regenerate allWords from all pages
    // This is simpler and more reliable than trying to update just current page
    setAllWords((prevAllWords) => {
      // Get all words from all pages by re-tokenizing the full text
      const allTokens = text.match(/\p{L}+|\p{P}+|\s+/gu) || [];
      const newAllWords = [];

      allTokens.forEach((token) => {
        if (/\p{L}+/u.test(token)) {
          const word = token.toLowerCase();
          if (!state.deletedWords.includes(word)) {
            newAllWords.push(word);
          }
        }
      });

      return newAllWords;
    });

    console.log(
      `✅ Updated page ${currentPage} with ${improvedTokens.length} improved tokens`,
    );
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
      const currentTranslation = prev.wordMetadata[word]?.translation || "";
      const newWordMetadata = {
        ...prev.wordMetadata,
        [word]: { translation: currentTranslation, fam: "ignored" },
      };

      return {
        ...prev,
        wordMetadata: newWordMetadata,
        // Don't close sidebar or clear selection - keep it open for ignored words
      };
    });
  };

  const handleUnmarkWord = (word) => {
    setState((prev) => {
      const newWordMetadata = { ...prev.wordMetadata };
      // Remove word metadata to unmark it
      delete newWordMetadata[word];

      return {
        ...prev,
        wordMetadata: newWordMetadata,
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
      .filter((word) => !state.deletedWords.includes(word));
  };

  const renderSentenceWithClickableWords = async (sentence) => {
    if (!sentence) return null;

    let words = [];

    // Use Chinese segmentation for Chinese language
    if (state.selectedLanguage === "Chinese") {
      try {
        const segmentation =
          await ChineseSegmentationService.segmentChineseSentence(sentence);
        words = segmentation.map((segment) => segment.word);
      } catch (error) {
        console.error(
          "Error in Chinese sentence segmentation, falling back to regex:",
          error,
        );
        words = sentence.match(/\p{L}+|\p{P}+|\s+/gu) || [];
      }
    } else {
      words = sentence.match(/\p{L}+|\p{P}+|\s+/gu) || [];
    }

    return words.map((token, index) => {
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
          className += "ring-2 ring-blue-500 ring-offset-1 ";
        }

        if (metadata?.fam === "known") {
          className += "text-gray-800";
        } else if (metadata?.fam === "ignored") {
          className += "text-gray-600";
        } else if (!metadata) {
          className += "text-red-600 bg-red-50 font-medium";
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
                  {renderedSentence || "No sentence available"}
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
