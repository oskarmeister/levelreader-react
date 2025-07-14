import React, { useContext } from "react";
import AppContext from "../context/AppContext";
import { StorageManager } from "../storageManager";

const WordBankView = () => {
  const { state, setState } = useContext(AppContext);

  const buttons = ["all", "unknown", "1", "2", "3", "known"];

  const handleFilter = (val) => {
    setState((prev) => ({ ...prev, filterValue: val }));
  };

  const populateWordBank = () => {
    let entriesToShow = [];

    if (state.filterValue === "unknown") {
      // Show words that appear in text but have no metadata and are not deleted
      const allWordsInText = new Set();
      Object.values(state.lessons).forEach((text) => {
        const words = text.match(/\p{L}+/gu) || [];
        words.forEach((word) => {
          const lowerWord = word.toLowerCase();
          if (!state.deletedWords.includes(lowerWord)) {
            allWordsInText.add(lowerWord);
          }
        });
      });

      entriesToShow = Array.from(allWordsInText)
        .filter((word) => !state.wordMetadata[word])
        .sort()
        .map((word) => [word, { translation: "", fam: "unknown" }]);
    } else {
      entriesToShow = Object.entries(state.wordMetadata)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .filter(([word, m]) => {
          if (state.filterValue === "all") return true;
          return m.fam === state.filterValue;
        });
    }

    return entriesToShow.map(([word, m]) => {
      return (
        <li
          key={word}
          className={`flex items-center border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-all ${
            m.fam === "unknown" ? "bg-red-50" : "bg-gray-50"
          }`}
        >
          <span
            className={`font-semibold flex-1 text-lg ${
              m.fam === "unknown" ? "text-red-600" : "text-gray-900"
            }`}
          >
            {word}
          </span>
          <span className="flex-1 text-gray-600 text-sm px-4">
            {m.translation ||
              (m.fam === "unknown" ? "Unknown word" : "No translation")}
          </span>
          <div className="flex gap-2">
            {["ignore", "1", "2", "3", "known"].map((val) => {
              const isIgnored = state.deletedWords.includes(word);
              const isCurrentLevel = val !== "ignore" && m.fam === val;

              return (
                <button
                  key={val}
                  className={`w-10 h-10 rounded-lg font-medium transition-all transform hover:scale-110 ${
                    val === "ignore" && isIgnored
                      ? "bg-gray-500 text-white shadow-md"
                      : val === "ignore"
                        ? "bg-gray-300 text-gray-700 hover:bg-gray-400 hover:text-white"
                        : isCurrentLevel
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-white border-2 border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600"
                  }`}
                  onClick={async () => {
                    if (val === "ignore") {
                      if (!isIgnored) {
                        setState((prev) => {
                          const newWordMetadata = { ...prev.wordMetadata };
                          delete newWordMetadata[word];
                          return {
                            ...prev,
                            deletedWords: [...prev.deletedWords, word],
                            wordMetadata: newWordMetadata,
                          };
                        });
                      }
                    } else {
                      setState((prev) => ({
                        ...prev,
                        deletedWords: prev.deletedWords.filter(
                          (w) => w !== word,
                        ),
                        wordMetadata: {
                          ...prev.wordMetadata,
                          [word]: {
                            translation: m.translation || "",
                            fam: val,
                          },
                        },
                      }));
                    }
                    await StorageManager.save(state);
                  }}
                >
                  {val === "ignore" ? "✕" : val === "known" ? "✓" : val}
                </button>
              );
            })}
          </div>
        </li>
      );
    });
  };

  return (
    <div
      className="container mx-auto overflow-visible"
      style={{ margin: "0 auto 200px", padding: "16px 16px 0" }}
    >
      <h2 className="text-2xl font-bold mb-6 overflow-visible">🔤 Word Bank</h2>

      {/* Filter section */}
      <div
        className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden"
        style={{
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div
          className="bg-gradient-to-r from-purple-50 to-violet-50 px-6 py-3 border-b border-gray-100"
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#374151",
            borderLeft: "4px solid #8B5CF6",
          }}
        >
          Filter Words
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-gray-700 font-medium">Show:</span>
            {buttons.map((btn) => (
              <button
                key={btn}
                className={`px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${
                  state.filterValue === btn
                    ? "bg-purple-600 text-white shadow-md"
                    : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                }`}
                onClick={() => handleFilter(btn)}
              >
                {btn === "known"
                  ? "✓ Known"
                  : btn === "all"
                    ? "All Words"
                    : btn === "unknown"
                      ? "🔴 Unknown"
                      : btn === "1"
                        ? "🟠 New"
                        : `Level ${btn}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Words List section */}
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
          Words (
          {(() => {
            if (state.filterValue === "unknown") {
              // Count unknown words that appear in lessons but have no metadata
              const allWordsInText = new Set();
              Object.values(state.lessons).forEach((text) => {
                const words = text.match(/\p{L}+/gu) || [];
                words.forEach((word) => {
                  const lowerWord = word.toLowerCase();
                  if (!state.deletedWords.includes(lowerWord)) {
                    allWordsInText.add(lowerWord);
                  }
                });
              });
              return Array.from(allWordsInText).filter(
                (word) => !state.wordMetadata[word],
              ).length;
            } else if (state.filterValue === "all") {
              // Count all known words plus unknown words
              const allWordsInText = new Set();
              Object.values(state.lessons).forEach((text) => {
                const words = text.match(/\p{L}+/gu) || [];
                words.forEach((word) => {
                  const lowerWord = word.toLowerCase();
                  if (!state.deletedWords.includes(lowerWord)) {
                    allWordsInText.add(lowerWord);
                  }
                });
              });
              const unknownCount = Array.from(allWordsInText).filter(
                (word) => !state.wordMetadata[word],
              ).length;
              const knownCount = Object.keys(state.wordMetadata).length;
              return knownCount + unknownCount;
            } else {
              return Object.entries(state.wordMetadata).filter(
                ([word, m]) => m.fam === state.filterValue,
              ).length;
            }
          })()}
          )
        </div>
        <div className="p-6">
          <ul className="list-none p-0 space-y-3">{populateWordBank()}</ul>
        </div>
      </div>
    </div>
  );
};

export default WordBankView;
