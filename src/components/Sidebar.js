import React, { useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import AppContext from "../context/AppContext";
import { StorageManager } from "../storageManager";
import TranslationService from "../services/translationService";
import { getLanguageCode } from "../utils/languageUtils";

const Sidebar = () => {
  const { state, setState } = useContext(AppContext);
  const location = useLocation();
  const word = state.selectedWord;

  // Only show sidebar in lesson view
  if (!location.pathname.startsWith("/lesson/")) {
    return null;
  }
  const [customTranslation, setCustomTranslation] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoTranslation, setAutoTranslation] = useState("");
  const [translationError, setTranslationError] = useState("");

  useEffect(() => {
    const translateWord = async () => {
      if (word && !state.wordMetadata[word]?.translation) {
        // Check if we have a cached translation
        const cachedTranslation = state.translationCache[word];
        if (cachedTranslation) {
          setAutoTranslation(cachedTranslation);
          return;
        }

        setLoading(true);
        setTranslationError("");
        setAutoTranslation("");

        try {
          const sourceLang = getLanguageCode(state.selectedLanguage);
          const result = await TranslationService.translateText(
            word,
            "en",
            sourceLang,
          );
          setAutoTranslation(result.translatedText);

          // Cache the translation
          const newCache = {
            ...state.translationCache,
            [word]: result.translatedText,
          };
          setState((prev) => ({ ...prev, translationCache: newCache }));
        } catch (error) {
          setTranslationError("Translation failed. Please add manually.");
          console.error("Translation error:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (word && state.sidebarOpen) {
      translateWord();
    }
  }, [word, state.sidebarOpen]);

  if (!state.sidebarOpen) return null;

  const closeSidebar = () =>
    setState((prev) => ({ ...prev, sidebarOpen: false }));

  const saveWordMetadata = async (word, translation, familiarity) => {
    const newMetadata = {
      ...state.wordMetadata,
      [word]: { translation, fam: familiarity },
    };
    setState((prev) => ({ ...prev, wordMetadata: newMetadata }));
    // Save to storage would go here
  };

  const handleSaveCustom = async () => {
    if (customTranslation) {
      await saveWordMetadata(
        word,
        customTranslation,
        state.wordMetadata[word]?.fam || "1",
      );
    }
  };

  const handleFamiliarityChange = async (famLevel) => {
    // Use auto-translation if available and no existing translation
    const currentTranslation =
      state.wordMetadata[word]?.translation || autoTranslation || "";
    await saveWordMetadata(word, currentTranslation, famLevel);

    // Clear auto-translation since it's now saved
    if (autoTranslation && !state.wordMetadata[word]?.translation) {
      setAutoTranslation("");
    }
  };

  const useAutoTranslation = async () => {
    if (autoTranslation) {
      await saveWordMetadata(
        word,
        autoTranslation,
        state.wordMetadata[word]?.fam || "1",
      );
      setAutoTranslation(""); // Clear auto translation since it's now saved
    }
  };

  const saved = state.wordMetadata[word]?.translation;
  const currentFamiliarity = state.wordMetadata[word]?.fam;

  return (
    <div className="fixed top-16 right-0 w-72 max-h-[calc(100vh-8rem)] bg-white rounded-l-lg shadow-lg overflow-hidden z-50 transform translate-x-0 transition-transform">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b border-gray-100 relative">
        <button
          onClick={closeSidebar}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 text-xl"
        >
          ×
        </button>
        <h3 className="text-xl font-bold text-gray-800 pr-8">{word}</h3>
      </div>

      <div className="p-4">
        {saved && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
            <div className="text-sm text-blue-600 font-medium mb-1">
              Saved Translation
            </div>
            <div className="text-blue-800">{saved}</div>
          </div>
        )}

        {autoTranslation && !saved && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg mb-4">
            <div className="text-sm text-green-600 font-medium mb-1">
              Auto Translation
            </div>
            <div className="text-green-800 mb-2">{autoTranslation}</div>
            <button
              onClick={useAutoTranslation}
              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
            >
              Use This Translation
            </button>
          </div>
        )}

        {translationError && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
            <div className="text-sm text-red-600">{translationError}</div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Translation
          </label>
          <input
            type="text"
            placeholder="Enter translation..."
            value={customTranslation}
            onChange={(e) => setCustomTranslation(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={handleSaveCustom}
            className="w-full mt-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
          >
            Save Translation
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Familiarity Level
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleFamiliarityChange("1")}
              className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                currentFamiliarity === "1"
                  ? "bg-orange-100 text-orange-800 border-2 border-orange-300"
                  : "bg-gray-100 text-gray-700 hover:bg-orange-50"
              }`}
            >
              Learning
            </button>
            <button
              onClick={() => handleFamiliarityChange("2")}
              className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                currentFamiliarity === "2"
                  ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-300"
                  : "bg-gray-100 text-gray-700 hover:bg-yellow-50"
              }`}
            >
              Familiar
            </button>
            <button
              onClick={() => handleFamiliarityChange("3")}
              className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                currentFamiliarity === "3"
                  ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-300"
                  : "bg-gray-100 text-gray-700 hover:bg-yellow-50"
              }`}
            >
              Well Known
            </button>
            <button
              onClick={() => handleFamiliarityChange("known")}
              className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                currentFamiliarity === "known"
                  ? "bg-green-100 text-green-800 border-2 border-green-300"
                  : "bg-gray-100 text-gray-700 hover:bg-green-50"
              }`}
            >
              Known
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
          <div className="text-purple-600">Translating...</div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
