# Floating Audio Player Feature

## Overview

The LevelReader app now includes a floating audio player that allows users to listen to audio tracks associated with lessons. When a lesson has an associated audio file, a floating play button appears in the bottom left corner of the lesson view.

## Features

### Floating Play Button

- Appears in the bottom-left corner when viewing a lesson that has audio
- Only visible when the audio player is not open
- Styled with the primary theme color with hover effects

### Floating Audio Player

- Opens when the play button is clicked
- Positioned at the bottom center of the screen
- Includes all standard audio controls:
  - **Timeline**: Shows current position and allows seeking by clicking
  - **Time Display**: Current time (left) and total duration (right)
  - **Previous**: Navigate to previous lesson with audio
  - **Back 15s**: Skip backward 15 seconds
  - **Play/Pause**: Toggle audio playback
  - **Forward 15s**: Skip forward 15 seconds
  - **Next**: Navigate to next lesson with audio
  - **Close**: Close the audio player

### Error Handling

- Displays "Audio file not available" message if the audio file cannot be loaded
- Gracefully handles missing or corrupted audio files

## Technical Implementation

### Components Created

1. **FloatingPlayButton.js**: The hovering play button component
2. **FloatingAudioPlayer.js**: The main audio player component with full controls

### State Management

- Audio file mappings are stored in the app state under `lessonAudio`
- Each language can have its own set of audio files
- Audio state is managed locally within the audio player component

### Audio File Structure

Audio files should be placed in the `/public/audio/` directory with the following naming convention:

- Files should be in MP3 format
- Filenames should match the lesson keys in the state

### Example Audio Mappings

```javascript
lessonAudio: {
  "The Little Prince": "/audio/the-little-prince.mp3",
  "Morning Coffee": "/audio/morning-coffee.mp3",
  "Ocean Waves": "/audio/ocean-waves.mp3"
}
```

## Usage

1. Navigate to any lesson that has an associated audio file
2. Click the floating play button in the bottom-left corner
3. Use the audio controls to:
   - Play/pause the audio
   - Seek to different positions using the timeline
   - Skip forward/backward by 15 seconds
   - Navigate between lessons with audio using Previous/Next buttons
4. Close the player using the X button in the top-right corner

## Future Enhancements

Potential improvements could include:

- Audio sync with text highlighting
- Playback speed controls
- Volume controls
- Playlist management for multiple audio tracks per lesson
- Audio transcription synchronization
- Bookmark/chapter support for longer audio files

## Browser Compatibility

The audio player uses the HTML5 Audio API and should work in all modern browsers that support:

- HTML5 Audio element
- MP3 audio format
- ES6+ JavaScript features
