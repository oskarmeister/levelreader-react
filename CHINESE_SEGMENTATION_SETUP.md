# Chinese Word Segmentation with Gemini AI

This application now supports intelligent Chinese word segmentation using Google's Gemini AI model when marking Chinese text.

## Setup Instructions

### 1. Install Dependencies

The required dependency has already been installed:

```bash
npm install @google/generative-ai
```

### 2. Configure Google API Key

1. Get your Google API key from the [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Update the `.env` file in the project root:

```env
REACT_APP_GOOGLE_API_KEY=AIzaSyAyMJKwv27hThFGQjHOHqmuwlJYVrEveis
```

### 3. Optional: Vertex AI Configuration

If you want to use Vertex AI instead of AI Studio, add these environment variables:

```env
REACT_APP_GOOGLE_GENAI_USE_VERTEXAI=True
REACT_APP_GOOGLE_CLOUD_PROJECT=your-project-id
REACT_APP_GOOGLE_CLOUD_LOCATION=global
```

## How It Works

### Automatic Chinese Text Processing

When you select Chinese as your language and work with Chinese text:

1. **Word Marking**: The application automatically detects Chinese language selection
2. **AI Segmentation**: Each sentence is sent to Gemini AI to determine word boundaries
3. **Intelligent Parsing**: The AI analyzes the context to properly segment Chinese words
4. **Fallback Support**: If the API is unavailable, it falls back to character-by-character segmentation

### Features

- **Context-Aware Segmentation**: Uses sentence context to determine proper word boundaries
- **Caching**: Segments are cached to avoid repeated API calls for the same sentences
- **Graceful Fallback**: Works even without API key (uses character-based segmentation)
- **Performance Optimized**: Only processes Chinese text, other languages use standard regex

### Example Usage

1. Import Chinese text into a lesson
2. Select "Chinese" as your language
3. Start marking words - the AI will automatically segment them properly
4. Words will be highlighted and clickable based on AI-determined boundaries

## Technical Implementation

### Components Modified

- **LessonView.js**: Updated to use Chinese segmentation for text parsing
- **ChineseSegmentationService.js**: New service for Gemini AI integration
- **Environment Variables**: Added support for Google API key configuration

### AI Prompt Engineering

The service uses a carefully crafted prompt to ensure accurate word segmentation:

```javascript
"Analyze this Chinese sentence and identify where each word starts and ends.
Return ONLY a JSON array of objects with 'word' and 'start' and 'end' properties
indicating the character positions (0-indexed)."
```

### Caching Strategy

- Sentence-level caching prevents redundant API calls
- Cache persists during the session
- Fallback segmentation for offline usage

## Troubleshooting

### API Key Issues

- Ensure your API key is correctly set in `.env`
- Verify the key has access to Gemini models
- Check browser console for error messages

### Segmentation Problems

- The service automatically falls back to character-based segmentation if AI fails
- Check network connectivity for API calls
- Verify the Chinese text encoding is correct

### Performance Considerations

- Segmentation is done sentence-by-sentence for accuracy
- Results are cached to improve performance
- Large texts may take a moment to process initially
