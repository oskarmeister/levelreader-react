import React from "react";

const FloatingPlayButton = ({ onClick, isVisible }) => {
  if (!isVisible) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 left-6 w-16 h-16 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-all duration-300 ease-in-out transform hover:scale-110 z-40 flex items-center justify-center"
      title="Play audio for this lesson"
    >
      <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    </button>
  );
};

export default FloatingPlayButton;
