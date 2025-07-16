import React, { useContext, useState } from "react";
import AppContext from "../context/AppContext";

const PlaylistView = () => {
  const { state, setState } = useContext(AppContext);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlists, setPlaylists] = useState([
    {
      id: "recent-audio",
      name: "Recent Audio",
      tracks: [],
      isSpecial: true,
    },
    {
      id: "playlist-1",
      name: "Spanish Learning",
      tracks: [],
    },
    {
      id: "playlist-2",
      name: "Morning Study",
      tracks: [],
    },
  ]);

  const handlePlaylistSelect = (playlist) => {
    setSelectedPlaylist(playlist);
  };

  const handleBackToPlaylists = () => {
    setSelectedPlaylist(null);
  };

  const handleCreateNewPlaylist = () => {
    const newPlaylist = {
      id: `playlist-${Date.now()}`,
      name: `New Playlist ${playlists.filter((p) => !p.isSpecial).length + 1}`,
      tracks: [],
    };
    setPlaylists([...playlists, newPlaylist]);
  };

  const handleAddAudioTrack = () => {
    // Placeholder for adding audio track functionality
    console.log(
      "Add audio track clicked for playlist:",
      selectedPlaylist?.name,
    );
  };

  const renderPlaylistList = () => (
    <div className="space-y-4">
      {playlists.map((playlist) => (
        <div
          key={playlist.id}
          className="bg-white rounded-xl p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg"
          style={{
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            borderLeft: playlist.isSpecial
              ? "4px solid #3B82F6"
              : "4px solid #8B5CF6",
          }}
          onClick={() => handlePlaylistSelect(playlist)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  playlist.isSpecial
                    ? "bg-blue-100 text-blue-600"
                    : "bg-purple-100 text-purple-600"
                }`}
              >
                {playlist.isSpecial ? "🎵" : "📋"}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {playlist.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {playlist.tracks.length} track
                  {playlist.tracks.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="text-gray-400">→</div>
          </div>
        </div>
      ))}

      <button
        onClick={handleCreateNewPlaylist}
        className="w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition-all duration-300 flex items-center justify-center space-x-2"
      >
        <span className="text-xl">+</span>
        <span className="font-medium">New playlist</span>
      </button>
    </div>
  );

  const renderPlaylistDetail = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6 pb-4 border-b border-gray-200">
        <button
          onClick={handleBackToPlaylists}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ← Back
        </button>
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            selectedPlaylist?.isSpecial
              ? "bg-blue-100 text-blue-600"
              : "bg-purple-100 text-purple-600"
          }`}
        >
          {selectedPlaylist?.isSpecial ? "🎵" : "📋"}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedPlaylist?.name}
          </h2>
          <p className="text-gray-500">
            {selectedPlaylist?.tracks.length} track
            {selectedPlaylist?.tracks.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Tracks */}
      <div className="flex-1 space-y-3">
        {selectedPlaylist?.tracks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">🎧</div>
            <p className="text-lg">No audio tracks yet</p>
            <p className="text-sm">Add your first audio track to get started</p>
          </div>
        ) : (
          selectedPlaylist?.tracks.map((track, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                  ▶️
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{track.name}</h4>
                  <p className="text-sm text-gray-500">{track.duration}</p>
                </div>
                <button className="p-1 hover:bg-gray-100 rounded">⋮</button>
              </div>
            </div>
          ))
        )}

        {/* Add Track Button */}
        <button
          onClick={handleAddAudioTrack}
          className="w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition-all duration-300 flex items-center justify-center space-x-2"
        >
          <span className="text-xl">+</span>
          <span className="font-medium">Add audio track</span>
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="container mx-auto overflow-visible"
      style={{ margin: "0 auto 200px", padding: "16px 16px 0" }}
    >
      <h2 className="text-2xl font-bold mb-6">🎵 Playlists</h2>

      <div className="flex h-[calc(100vh-200px)]">
        {/* Playlist List - Full width when no selection, 1/3 when selected */}
        <div
          className={`transition-all duration-500 ease-in-out ${
            selectedPlaylist ? "w-1/3 pr-6 border-r border-gray-200" : "w-full"
          }`}
        >
          <div
            className={`h-full ${selectedPlaylist ? "" : "max-w-2xl mx-auto"}`}
          >
            {renderPlaylistList()}
          </div>
        </div>

        {/* Playlist Detail - Hidden when no selection, 2/3 when selected */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            selectedPlaylist ? "w-2/3 pl-6 opacity-100" : "w-0 opacity-0"
          }`}
        >
          {selectedPlaylist && renderPlaylistDetail()}
        </div>
      </div>
    </div>
  );
};

export default PlaylistView;
