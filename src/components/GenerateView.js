import React, { useState, useContext } from "react";
import AppContext from "../context/AppContext";
import { StorageManager } from "../storageManager";

const GenerateView = () => {
  const { state, setState } = useContext(AppContext);
  const [selectedLanguage, setSelectedLanguage] = useState("Spanish");
  const [topic, setTopic] = useState("");
  const [contentLength, setContentLength] = useState(300);
  const [knownWordRatio, setKnownWordRatio] = useState(80);
  const [contentStyle, setContentStyle] = useState("casual");
  const [difficultyLevel, setDifficultyLevel] = useState("intermediate");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [activeTab, setActiveTab] = useState("generate");

  const languages = ["Spanish", "French", "German", "Italian", "Portuguese"];
  const knownWords = Object.keys(state.wordMetadata).filter(
    (word) => state.wordMetadata[word]?.fam === "known",
  ).length;
  const totalWords = Object.keys(state.wordMetadata).length || 5000;

  const handleGenerate = () => {
    setIsGenerating(true);

    // Simulate AI content generation
    setTimeout(() => {
      const mockContent = `Here's a ${topic ? topic + " themed" : "practice"} text in ${selectedLanguage}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.`;

      setGeneratedContent(mockContent);
      setIsGenerating(false);
    }, 2000);
  };

  const handleReset = () => {
    setTopic("");
    setContentLength(300);
    setKnownWordRatio(80);
    setGeneratedContent("");
  };

  const handleSaveAsLesson = async () => {
    if (generatedContent && topic) {
      const lessonTitle = `Generated: ${topic}`;
      if (state.lessons[lessonTitle]) {
        alert("A lesson with this title already exists.");
        return;
      }
      setState((prev) => ({
        ...prev,
        lessons: { ...prev.lessons, [lessonTitle]: generatedContent },
      }));
      await StorageManager.save(state);
      alert("Content saved as lesson!");
    } else {
      alert("Please generate content and provide a topic first.");
    }
  };

  return (
    <div
      className="container mx-auto overflow-visible"
      style={{ margin: "0 auto 200px", padding: "16px 16px 0" }}
    >
      <h2 className="text-2xl font-bold mb-6 overflow-visible">
        🤖 AI Content Generator
      </h2>

      {/* Main Card */}
      <div
        className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden"
        style={{
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      >
        {/* Header */}
        <div
          className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100"
          style={{
            borderLeft: "4px solid #8B5CF6",
          }}
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                AI Content Generator
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Generate custom reading content using your vocabulary knowledge
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                {knownWords} / {totalWords} words known
              </div>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${(knownWords / totalWords) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="p-6">
          <div className="flex gap-2 mb-6">
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "generate"
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-purple-50 text-purple-700 hover:bg-purple-100"
              }`}
              onClick={() => setActiveTab("generate")}
            >
              Generate Content
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "settings"
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-purple-50 text-purple-700 hover:bg-purple-100"
              }`}
              onClick={() => setActiveTab("settings")}
            >
              Settings
            </button>
          </div>

          {/* Generate Tab */}
          {activeTab === "generate" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Controls */}
              <div className="space-y-6">
                {/* Language Selection */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Target Language
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Topic */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Topic or Theme
                  </label>
                  <input
                    type="text"
                    placeholder="Enter a topic for your content"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Content Length */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-gray-700 text-sm font-medium">
                      Content Length (words)
                    </label>
                    <span className="text-sm text-gray-600">
                      {contentLength}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={contentLength}
                    onChange={(e) => setContentLength(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Known Word Ratio */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <label className="text-gray-700 text-sm font-medium">
                        Known Word Ratio
                      </label>
                      <div className="group relative">
                        <span className="text-gray-400 cursor-help">ℹ️</span>
                        <div className="invisible group-hover:visible absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                          Percentage of words you already know
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">
                      {knownWordRatio}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={knownWordRatio}
                    onChange={(e) => setKnownWordRatio(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !topic}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 ${
                      isGenerating || !topic
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg"
                    }`}
                  >
                    {isGenerating ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </div>
                    ) : (
                      "Generate Content"
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={isGenerating}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all transform hover:scale-105"
                  >
                    🔄
                  </button>
                </div>
              </div>

              {/* Right Column - Generated Content */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-gray-700 text-sm font-medium">
                    Generated Content
                  </label>
                  {generatedContent && (
                    <div className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      ~{contentLength} words
                    </div>
                  )}
                </div>
                <textarea
                  placeholder="Your generated content will appear here..."
                  value={generatedContent}
                  readOnly
                  className="w-full h-80 p-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Content Style */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Content Style
                  </label>
                  <select
                    value={contentStyle}
                    onChange={(e) => setContentStyle(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="casual">Casual Conversation</option>
                    <option value="formal">Formal Writing</option>
                    <option value="story">Story Narrative</option>
                    <option value="academic">Academic Text</option>
                  </select>
                </div>

                {/* Difficulty Level */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={difficultyLevel}
                    onChange={(e) => setDifficultyLevel(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="beginner">Beginner (A1-A2)</option>
                    <option value="intermediate">Intermediate (B1-B2)</option>
                    <option value="advanced">Advanced (C1-C2)</option>
                  </select>
                </div>
              </div>

              {/* Advanced Options */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Advanced Options
                </label>
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚙️</span>
                      <span className="text-gray-700">
                        Include grammar structures from your level
                      </span>
                    </div>
                    <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all">
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Click on words in the generated text to see translations and add to
            your vocabulary
          </div>
          <button
            onClick={handleSaveAsLesson}
            disabled={!generatedContent}
            className={`px-6 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${
              !generatedContent
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
            }`}
          >
            Save as Lesson
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateView;
