import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppContext from "../context/AppContext";

const LessonView = () => {
  const { state, setState } = useContext(AppContext);
  const { key } = useParams();
  const navigate = useNavigate();
  const [renderedText, setRenderedText] = useState([]);

  useEffect(() => {
    const text = state.lessons[key];
    if (text) {
      setState((prev) => ({ ...prev, currentText: text }));
      renderText(text);
    }
  }, [key, state.wordMetadata, state.deletedWords]);

  const renderText = (text) => {
    const words = text.match(/\p{L}+|\p{P}+|\s+/gu) || [];
    const rendered = words.map((token, index) => {
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

    setRenderedText(rendered);
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
          <div className="prose prose-lg max-w-none leading-relaxed text-lg">
            {renderedText}
          </div>
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
