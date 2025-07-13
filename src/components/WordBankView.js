import React, { useContext } from "react";
import AppContext from "../context/AppContext";
import { StorageManager } from "../storageManager";

const WordBankView = () => {
  const { state, setState } = useContext(AppContext);

  const buttons = ["all", "1", "2", "3", "known"];

  const handleFilter = (val) => {
    setState((prev) => ({ ...prev, filterValue: val }));
  };

  const populateWordBank = () => {
    return Object.entries(state.wordMetadata)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([word, m]) => {
        if (state.filterValue !== "all" && m.fam !== state.filterValue)
          return null;
        return (
          <li
            key={word}
            className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-all"
          >
            <span className="font-semibold flex-1 text-gray-900 text-lg">
              {word}
            </span>
            <span className="flex-1 text-gray-600 text-sm px-4">
              {m.translation || "No translation"}
            </span>
            <div className="flex gap-2">
              {["0", "1", "2", "3", "known"].map((val) => (
                <button
                  key={val}
                  className={`w-10 h-10 rounded-lg font-medium transition-all transform hover:scale-110 ${
                    val === "0" && state.deletedWords.includes(word)
                      ? "bg-red-500 text-white shadow-md"
                      : val === "0"
                        ? "bg-gray-300 text-gray-700 hover:bg-red-400 hover:text-white"
                        : val !== "0" && m.fam === val
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-white border-2 border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600"
                  }`}
                  onClick={async () => {
                    if (val === "0") {
                      if (!state.deletedWords.includes(word)) {
                        setState((prev) => ({
                          ...prev,
                          deletedWords: [...prev.deletedWords, word],
                        }));
                        delete state.wordMetadata[word];
                      }
                    } else {
                      setState((prev) => ({
                        ...prev,
                        deletedWords: prev.deletedWords.filter(
                          (w) => w !== word,
                        ),
                        wordMetadata: {
                          ...prev.wordMetadata,
                          [word]: { translation: m.translation, fam: val },
                        },
                      }));
                    }
                    await StorageManager.save(state);
                  }}
                >
                  {val === "0" ? "🗑️" : val === "known" ? "✓" : val}
                </button>
              ))}
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
          {
            Object.entries(state.wordMetadata).filter(
              ([word, m]) =>
                state.filterValue === "all" || m.fam === state.filterValue,
            ).length
          }
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
