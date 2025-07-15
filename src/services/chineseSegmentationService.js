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

    // Use improved fallback segmentation (API temporarily disabled due to network issues)
    console.log(
      "Using improved fallback segmentation due to API network issues",
    );
    const segmentation = this.fallbackSegmentation(sentence);

    // Cache the result
    this.segmentationCache.set(sentence, segmentation);

    return segmentation;
  }

  fallbackSegmentation(sentence) {
    console.log("Using improved fallback segmentation");
    const segmentation = [];

    // Simple rule-based segmentation for better word boundaries
    let i = 0;
    while (i < sentence.length) {
      const char = sentence[i];

      // Handle punctuation and spaces as single tokens
      if (/[\s\p{P}]/u.test(char)) {
        segmentation.push({
          word: char,
          start: i,
          end: i + 1,
        });
        i++;
        continue;
      }

      // For Chinese characters, try to group common patterns
      if (/[\u4e00-\u9fff]/u.test(char)) {
        let word = char;
        let wordEnd = i + 1;

        // Look ahead for common 2-character words
        if (i + 1 < sentence.length) {
          const nextChar = sentence[i + 1];
          const twoCharWord = char + nextChar;

          // Common Chinese 2-character words (basic list)
          const commonWords = [
            "如果",
            "因为",
            "所以",
            "但是",
            "然后",
            "现在",
            "时候",
            "地方",
            "今天",
            "明天",
            "昨天",
            "什么",
            "为什么",
            "怎么",
            "哪里",
            "谁",
            "我们",
            "你们",
            "他们",
            "自己",
            "大家",
            "老师",
            "学生",
            "朋友",
            "工作",
            "学习",
            "生活",
            "时间",
            "问题",
            "方法",
            "结果",
            "原因",
            "开始",
            "结束",
            "继续",
            "停止",
            "进入",
            "出来",
            "回去",
            "过来",
            "可以",
            "应该",
            "必须",
            "需要",
            "想要",
            "希望",
            "觉得",
            "认为",
            "知道",
            "了解",
            "明白",
            "理解",
            "记得",
            "忘记",
            "学会",
            "教学",
            "帮助",
            "支持",
            "合作",
            "努力",
            "成功",
            "失败",
            "进步",
            "改进",
            "发展",
            "变化",
            "增加",
            "减少",
            "提高",
            "降低",
            "改善",
            "恶化",
          ];

          if (commonWords.includes(twoCharWord)) {
            word = twoCharWord;
            wordEnd = i + 2;
          }
        }

        segmentation.push({
          word: word,
          start: i,
          end: wordEnd,
        });
        i = wordEnd;
      } else {
        // For non-Chinese characters, treat individually
        segmentation.push({
          word: char,
          start: i,
          end: i + 1,
        });
        i++;
      }
    }

    console.log("Fallback segmentation result:", segmentation);
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
    console.log("=== TESTING SEGMENTATION (FALLBACK) ===");
    console.log("Test sentence:", testSentence);

    const segResult = await this.segmentChineseSentence(testSentence);
    console.log("Segmentation test result:", segResult);
    return segResult;
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
