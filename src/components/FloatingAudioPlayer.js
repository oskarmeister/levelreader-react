import React, { useState, useRef, useEffect } from "react";

const FloatingAudioPlayer = ({
  audioSrc,
  isVisible,
  onClose,
  lessonTitle,
  onTrackChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioSrc]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seekTo = (time) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const handleProgressClick = (e) => {
    const progressBar = e.currentTarget;
    const clickX = e.nativeEvent.offsetX;
    const width = progressBar.offsetWidth;
    const newTime = (clickX / width) * duration;
    seekTo(newTime);
  };

  const skipBackward = () => {
    seekTo(Math.max(0, currentTime - 15));
  };

  const skipForward = () => {
    seekTo(Math.min(duration, currentTime + 15));
  };

  const handlePrevious = () => {
    if (onTrackChange) {
      onTrackChange("previous");
    }
  };

  const handleNext = () => {
    if (onTrackChange) {
      onTrackChange("next");
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 bg-white shadow-lg border-t border-gray-200 p-4 z-50 transition-all duration-300 ease-in-out">
      <div className="max-w-4xl mx-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Lesson title */}
        <div className="text-center mb-3">
          <h3 className="text-sm font-medium text-gray-800 truncate">
            {lessonTitle}
          </h3>
        </div>

        {/* Timeline */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div
            className="w-full h-2 bg-gray-200 rounded-full cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-primary rounded-full transition-all duration-100 ease-out"
              style={{
                width: duration ? `${(currentTime / duration) * 100}%` : "0%",
              }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4">
          {/* Previous button */}
          <button
            onClick={handlePrevious}
            className="p-2 text-gray-600 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!onTrackChange}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
              />
            </svg>
          </button>

          {/* Back 15 seconds */}
          <button
            onClick={skipBackward}
            className="p-2 text-gray-600 hover:text-primary transition-colors flex items-center"
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4z"
              />
            </svg>
            <span className="text-xs">15</span>
          </button>

          {/* Play/Pause button */}
          <button
            onClick={togglePlayPause}
            className="p-3 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors shadow-lg"
          >
            {isPlaying ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 9v6m4-6v6"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15a2 2 0 012 2v3a2 2 0 01-2 2H9a2 2 0 01-2-2v-3a2 2 0 012-2z"
                />
              </svg>
            )}
          </button>

          {/* Forward 15 seconds */}
          <button
            onClick={skipForward}
            className="p-2 text-gray-600 hover:text-primary transition-colors flex items-center"
          >
            <span className="text-xs mr-1">15</span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
              />
            </svg>
          </button>

          {/* Next button */}
          <button
            onClick={handleNext}
            className="p-2 text-gray-600 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!onTrackChange}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
              />
            </svg>
          </button>
        </div>

        {/* Audio element */}
        <audio ref={audioRef} src={audioSrc} preload="metadata" />
      </div>
    </div>
  );
};

export default FloatingAudioPlayer;
