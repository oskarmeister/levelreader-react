import { GoogleGenerativeAI } from "@google/generative-ai";

class ChineseSegmentationService {
  constructor() {
    const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
    console.log("=== CHINESE SEGMENTATION DEBUG ===");
    console.log(
      "All REACT_APP env vars:",
      Object.keys(process.env).filter((key) => key.startsWith("REACT_APP_")),
    );
    console.log("REACT_APP_GOOGLE_API_KEY value:", apiKey);
    console.log(
      "Raw API key:",
      apiKey ? `${apiKey.substring(0, 10)}...` : "null/undefined",
    );
    console.log("API key length:", apiKey ? apiKey.length : 0);
    console.log(
      "API key is valid:",
      !(!apiKey || apiKey === "YOUR_API_KEY_HERE"),
    );

    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
      console.warn(
        "Google API key not set. Chinese segmentation will use fallback method.",
      );
      this.genAI = null;
      this.model = null;
    } else {
      console.log("Initializing GoogleGenerativeAI...");
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });
      console.log("GoogleGenerativeAI initialized successfully");
    }

    // Cache to avoid redundant API calls for the same sentences
    this.segmentationCache = new Map();

    console.log(
      "ChineseSegmentationService initialized with model:",
      !!this.model,
    );
    console.log("==============================");
  }

  async segmentChineseSentence(sentence) {
    console.log("Segmenting Chinese sentence:", sentence);

    // Check cache first
    if (this.segmentationCache.has(sentence)) {
      console.log("Using cached segmentation");
      return this.segmentationCache.get(sentence);
    }

    // If no API key or model, use fallback
    if (!this.model) {
      console.log("No API key/model, using fallback segmentation");
      return this.fallbackSegmentation(sentence);
    }

    try {
      const prompt = `Segment this Chinese text into meaningful words. Return ONLY a JSON array where each object has "word", "start", and "end" properties. Group characters into proper Chinese words, not individual characters.

Text: "${sentence}"

IMPORTANT RULES:
- Combine characters into meaningful Chinese words (e.g., "如果" is ONE word, not "如" + "果")
- "测试" is ONE word, not "测" + "试"
- "单词" is ONE word, not "单" + "词"
- Include punctuation and spaces as separate items
- Use 0-indexed character positions
- Return only valid JSON, no explanations

Example for "如果你好":
[{"word":"如果","start":0,"end":2},{"word":"你好","start":2,"end":4}]

JSON:`;

      console.log("Calling Gemini API for sentence:", sentence);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log("Gemini API response:", text);

      // Parse the JSON response
      const cleanedResponse = text.replace(/```json\n?|\n?```/g, "").trim();
      console.log("Cleaned response:", cleanedResponse);

      const segmentation = JSON.parse(cleanedResponse);

      // Validate the segmentation
      if (!Array.isArray(segmentation)) {
        throw new Error("Invalid segmentation response: not an array");
      }

      console.log("Successful segmentation:", segmentation);

      // Cache the result
      this.segmentationCache.set(sentence, segmentation);

      return segmentation;
    } catch (error) {
      console.error("Error in Chinese segmentation:", error);
      console.log("Falling back to character-by-character segmentation");
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

  // Test function that can be called from browser console
  async testAPI(testSentence = "如果你好") {
    console.log("=== TESTING GEMINI API ===");
    console.log("Test sentence:", testSentence);
    console.log("Has model:", !!this.model);

    if (!this.model) {
      console.log("No model available, cannot test API");
      return null;
    }

    try {
      const result = await this.model.generateContent(
        'Test: Please respond with "API working"',
      );
      const response = await result.response;
      const text = response.text();
      console.log("API test response:", text);

      // Now test with segmentation
      const segResult = await this.segmentChineseSentence(testSentence);
      console.log("Segmentation test result:", segResult);
      return segResult;
    } catch (error) {
      console.error("API test failed:", error);
      return null;
    }
  }
}

const chineseSegmentationService = new ChineseSegmentationService();

// Expose globally for debugging
if (typeof window !== "undefined") {
  window.chineseSegmentationService = chineseSegmentationService;
  console.log(
    "Chinese segmentation service exposed globally as window.chineseSegmentationService",
  );
}

export default chineseSegmentationService;
