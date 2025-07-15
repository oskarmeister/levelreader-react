import { GoogleGenerativeAI } from "@google/generative-ai";

class ChineseSegmentationService {
  constructor() {
    const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
      console.warn(
        "Google API key not set. Chinese segmentation will use fallback method.",
      );
      this.genAI = null;
      this.model = null;
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
      });
    }

    // Cache to avoid redundant API calls for the same sentences
    this.segmentationCache = new Map();
  }

  async segmentChineseSentence(sentence) {
    // Check cache first
    if (this.segmentationCache.has(sentence)) {
      return this.segmentationCache.get(sentence);
    }

    try {
      const prompt = `Analyze this Chinese sentence and identify where each word starts and ends. Return ONLY a JSON array of objects with "word" and "start" and "end" properties indicating the character positions (0-indexed).

Sentence: "${sentence}"

Rules:
1. Include all words, punctuation, and spaces as separate objects
2. Use character positions, not byte positions
3. Return valid JSON only, no explanations
4. Example format: [{"word":"我","start":0,"end":1},{"word":"爱","start":1,"end":2},{"word":"你","start":2,"end":3}]

JSON:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the JSON response
      const cleanedResponse = text.replace(/```json\n?|\n?```/g, "").trim();
      const segmentation = JSON.parse(cleanedResponse);

      // Validate the segmentation
      if (!Array.isArray(segmentation)) {
        throw new Error("Invalid segmentation response: not an array");
      }

      // Cache the result
      this.segmentationCache.set(sentence, segmentation);

      return segmentation;
    } catch (error) {
      console.error("Error in Chinese segmentation:", error);
      // Fallback to character-by-character segmentation
      return this.fallbackSegmentation(sentence);
    }
  }

  fallbackSegmentation(sentence) {
    const segmentation = [];
    for (let i = 0; i < sentence.length; i++) {
      const char = sentence[i];
      segmentation.push({
        word: char,
        start: i,
        end: i + 1,
      });
    }
    return segmentation;
  }

  async segmentChineseText(text) {
    // Split text into sentences for more accurate segmentation
    const sentences = text.split(/([。！？；])/);
    const allSegments = [];
    let currentPosition = 0;

    for (const sentence of sentences) {
      if (sentence.trim().length === 0) {
        currentPosition += sentence.length;
        continue;
      }

      const segmentation = await this.segmentChineseSentence(sentence);

      // Adjust positions to be relative to the entire text
      const adjustedSegmentation = segmentation.map((segment) => ({
        ...segment,
        start: segment.start + currentPosition,
        end: segment.end + currentPosition,
      }));

      allSegments.push(...adjustedSegmentation);
      currentPosition += sentence.length;
    }

    return allSegments;
  }

  extractWordsFromSegmentation(segmentation) {
    return segmentation
      .filter((segment) => /\p{L}/u.test(segment.word)) // Only include segments with letters (words)
      .map((segment) => segment.word.toLowerCase());
  }

  clearCache() {
    this.segmentationCache.clear();
  }
}

export default new ChineseSegmentationService();
