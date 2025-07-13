import React, { useContext, useState } from "react";
import AppContext from "../context/AppContext";
import { StorageManager } from "../storageManager";

const Sidebar = () => {
  const { state, setState } = useContext(AppContext);
  const word = state.selectedWord;
  const [customTranslation, setCustomTranslation] = useState("");
  const [loading, setLoading] = useState(false);

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
    const currentTranslation = state.wordMetadata[word]?.translation || "";
    await saveWordMetadata(word, currentTranslation, famLevel);
  };

  const saved = state.wordMetadata[word]?.translation;
  const currentFamiliarity = state.wordMetadata[word]?.fam;

  // Highlight buttons and familiarity logic

  return (
    <div className="fixed top-16 right-0 w-72 max-h-[calc(100vh-8rem)] bg-white rounded-l-lg shadow-lg p-4 overflow-y-auto z-50 transform translate-x-0 transition-transform">
      <button onClick={closeSidebar} className="absolute top-2 right-2 text-xl">
        ×
      </button>
      <h3 className="text-xl font-bold mb-2">{word}</h3>
      {saved && <div className="bg-blue-100 p-2 rounded mb-2">{saved}</div>}
      {translation && !saved && (
        <div
          className="bg-green-100 p-2 rounded mb-2 cursor-pointer"
          onClick={() =>
            WordManager.saveWordMetadata(
              word,
              translation,
              "1",
              state,
              setState,
            )
          }
        >
          {translation}
        </div>
      )}
      <input
        type="text"
        placeholder="Custom Translation"
        value={customTranslation}
        onChange={(e) => setCustomTranslation(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      <button
        onClick={handleSaveCustom}
        className="w-full bg-primary text-white py-2 rounded mb-2"
      >
        Save Translation
      </button>
      <div className="flex justify-between">{/* Familiarity buttons */}</div>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
          Loading...
        </div>
      )}
    </div>
  );
};

export default Sidebar;
