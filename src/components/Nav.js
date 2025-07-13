import React, { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppContext from "../context/AppContext";

const Nav = () => {
  const { state } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("Spanish");

  const tabs = [
    { id: "tab-library", label: "Library", path: "/library" },
    { id: "tab-wordbank", label: "Word Bank", path: "/wordbank" },
    { id: "tab-import", label: "Import", path: "/import" },
    { id: "tab-generate", label: "Generate", path: "/generate" },
  ];

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
    </nav>
  );
};

export default Nav;
