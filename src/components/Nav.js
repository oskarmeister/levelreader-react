import React, { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppContext from "../context/AppContext";

const Nav = () => {
  const { state, setState } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const tabs = [
    { id: "tab-library", label: "Library", path: "/library" },
    { id: "tab-audio", label: "Audio", path: "/playlist" },
    { id: "tab-wordbank", label: "Word Bank", path: "/wordbank" },
    { id: "tab-generate", label: "Generate", path: "/generate" },
  ];

  const languages = [
    { name: "Spanish", flag: "🇪🇸" },
    { name: "Swedish", flag: "🇸🇪" },
    { name: "Chinese", flag: "🇨🇳" },
    { name: "English", flag: "🇺🇸" },
    { name: "German", flag: "🇩🇪" },
    { name: "French", flag: "🇫🇷" },
  ];

  const currentLanguage =
    languages.find((lang) => lang.name === state.selectedLanguage) ||
    languages[0];

  const handleLanguageSelect = (language) => {
    setState((prev) => ({ ...prev, selectedLanguage: language.name }));
    setShowLanguageDropdown(false);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center"
      style={{
        background:
          "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        padding: "12px 24px",
      }}
    >
      <div
        className="logo font-bold text-xl"
        style={{
          background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        📚 LevelReader
      </div>

      <div className="tabs flex gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${
              location.pathname === tab.path
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-300"
            }`}
            onClick={() =>
              state.token ? navigate(tab.path) : navigate("/account")
            }
            style={{
              boxShadow:
                location.pathname === tab.path
                  ? "0 4px 6px -1px rgba(59, 130, 246, 0.3)"
                  : "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {/* Language Selector */}
        <div className="relative">
          <button
            className="flex items-center bg-white text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all transform hover:scale-105"
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            style={{
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            }}
          >
            <span className="text-lg mr-2">{currentLanguage.flag}</span>
            <span className="font-medium text-sm">{currentLanguage.name}</span>
            <span className="ml-1 text-gray-400">▼</span>
          </button>

          {/* Language Dropdown */}
          {showLanguageDropdown && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowLanguageDropdown(false)}
              />
              {/* Dropdown Menu */}
              <div
                className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-48"
                style={{
                  boxShadow:
                    "0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                }}
              >
                {languages.map((language) => (
                  <button
                    key={language.name}
                    className={`w-full flex items-center px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                      state.selectedLanguage === language.name
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700"
                    }`}
                    onClick={() => handleLanguageSelect(language)}
                  >
                    <span className="text-lg mr-3">{language.flag}</span>
                    <span className="font-medium">{language.name}</span>
                    {state.selectedLanguage === language.name && (
                      <span className="ml-auto text-blue-600">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          className="profile-btn flex items-center bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all transform hover:scale-105"
          onClick={() => navigate("/account")}
          style={{
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <span className="user-icon mr-2 text-lg">👤</span>
          <span className="font-medium" id="username-display">
            {state.username || "Login"}
          </span>
        </button>
      </div>
    </nav>
  );
};

export default Nav;
