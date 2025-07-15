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

    // Cache to avoid redundant API calls
    this.segmentationCache = new Map();
    // Track pagination-based segmentation
    this.pageSegmentationCache = new Map();
    // Track which pages are currently being segmented
    this.segmentingPages = new Set();

    // NEW: Page segmentation tracking system
    this.pageSegmentationStatus = new Map(); // page -> 'pending' | 'segmenting' | 'completed' | 'failed'
    this.totalPages = 0;
    this.currentViewedPage = 0;
    this.wordsPerPage = 300; // Track current words per page setting

    // Callback for UI updates when segmentation completes
    this.onSegmentationComplete = null;

    // Circuit breaker for API failures
    this.apiFailureCount = 0;
    this.maxApiFailures = 1; // Stop trying API after 1 failure (since API is clearly not working)
    this.apiDisabled = false;
    this.lastFailureTime = null;
    this.isTestingApi = false; // Prevent concurrent API tests

    console.log(
      "ChineseSegmentationService initialized with model:",
      !!this.model,
    );
    console.log("🔄 Circuit breaker: maxFailures =", this.maxApiFailures);
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

    // Test API connectivity on first call if not already tested
    if (!this.apiDisabled && !this.isTestingApi && this.apiFailureCount === 0) {
      console.log("🔍 Testing API connectivity on first call...");
      this.isTestingApi = true;
      try {
        // Quick test with minimal text
        const testPromise = this.model.generateContent("Test");
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Quick test timeout")), 5000),
        );
        await Promise.race([testPromise, timeoutPromise]);
        console.log("✅ API test successful");
        this.isTestingApi = false;
      } catch (error) {
        console.log("❌ API test failed, disabling API immediately");
        this.handleApiFailure();
        this.isTestingApi = false;
        return this.fallbackSegmentation(sentence);
      }
    }

    // Circuit breaker: if API has failed multiple times, use fallback
    if (this.apiDisabled) {
      console.log(
        "🚫 API DISABLED: Using fallback segmentation (failures: " +
          this.apiFailureCount +
          "/" +
          this.maxApiFailures +
          ")",
      );
      return this.fallbackSegmentation(sentence);
    }

    try {
      const prompt = `You are a Chinese text segmentation expert. Segment the following Chinese text into meaningful words.

Text to segment: "${sentence}"

Rules:
1. Group characters into proper Chinese words (如果=one word, not 如+果)
2. Include punctuation and spaces as separate items
3. Use 0-indexed character positions
4. Return ONLY valid JSON - no explanations or extra text

Response format (JSON array only):
[{"word":"word1","start":0,"end":N},{"word":"word2","start":N,"end":M}]

For text "如果你好", respond: [{"word":"如果","start":0,"end":2},{"word":"你好","start":2,"end":4}]

JSON:`;

      console.log("Calling Gemini API for text:", sentence);

      // Add 30-second timeout as requested
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("API request timeout after 30 seconds")),
          30000,
        ),
      );

      const apiPromise = this.model.generateContent(prompt);

      const result = await Promise.race([apiPromise, timeoutPromise]);
      const response = await result.response;
      const text = response.text();

      console.log("Gemini API response length:", text.length);
      console.log(
        "Gemini API response preview:",
        text.substring(0, 500) + "...",
      );

      // Clean and parse the JSON response with better error handling
      let cleanedResponse = text.replace(/```json\n?|\n?```/g, "").trim();

      // Additional cleaning for common issues
      cleanedResponse = cleanedResponse.replace(/\n/g, " "); // Remove newlines
      cleanedResponse = cleanedResponse.replace(/\s+/g, " "); // Normalize spaces

      // Try to extract JSON array if it's embedded in other text
      const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }

      console.log(
        "Cleaned response preview:",
        cleanedResponse.substring(0, 200) + "...",
      );

      let segmentation;
      try {
        segmentation = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("Failed to parse:", cleanedResponse.substring(0, 1000));

        // Try to fix common JSON issues
        let fixedResponse = cleanedResponse;

        // Fix unescaped quotes in values by escaping them
        fixedResponse = fixedResponse.replace(
          /"([^"]*)"([^"]*)"([^"]*)"/g,
          '"$1\\"$2\\"$3"',
        );

        // Try parsing the fixed version
        try {
          segmentation = JSON.parse(fixedResponse);
          console.log("Successfully parsed with fixes");
        } catch (secondError) {
          console.error("Still failed after fixes:", secondError);
          throw new Error(
            `Failed to parse JSON response: ${parseError.message}`,
          );
        }
      }

      // Validate the segmentation
      if (!Array.isArray(segmentation)) {
        throw new Error("Invalid segmentation response: not an array");
      }

      console.log("Successful segmentation:", segmentation);

      // Reset circuit breaker on successful API call
      this.handleApiSuccess();

      // Cache the result
      this.segmentationCache.set(sentence, segmentation);

      return segmentation;
    } catch (error) {
      console.error("Error in Chinese segmentation:", error);

      // Handle specific error types and update circuit breaker
      if (
        error.message.includes("Failed to fetch") ||
        error.name === "TypeError"
      ) {
        console.log(
          "Network error detected - API may be unavailable or blocked",
        );
        this.handleApiFailure();
      } else if (error.message.includes("JSON")) {
        console.log("JSON parsing error - malformed API response");
        // Don't count JSON errors as API failures - the API responded
      } else if (error.message.includes("timeout")) {
        console.log("API request timed out after 30 seconds");
        this.handleApiFailure();
      } else {
        console.log("Unknown error type:", error.name, error.message);
        this.handleApiFailure();
      }

      console.log("Falling back to improved local segmentation");
      return this.fallbackSegmentation(sentence);
    }
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

          // Common Chinese 2-character words (expanded list)
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
            "��么",
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
            "需��",
            "想要",
            "希望",
            "觉得",
            "认��",
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

  // Smart pagination-based segmentation
  async segmentPageRange(text, startPage, endPage, wordsPerPage) {
    // Use stored text if not provided (for background segmentation)
    const textToUse = text || this.currentText;
    if (!textToUse) {
      console.error("No text provided for segmentation");
      return [];
    }

    const cacheKey = `${startPage}-${endPage}-${wordsPerPage}`;

    // Check if already cached
    if (this.pageSegmentationCache.has(cacheKey)) {
      console.log(
        `Using cached segmentation for pages ${startPage}-${endPage}`,
      );
      return this.pageSegmentationCache.get(cacheKey);
    }

    // Check if already being segmented
    if (this.segmentingPages.has(cacheKey)) {
      console.log(
        `Pages ${startPage}-${endPage} already being segmented, waiting...`,
      );
      // Wait for it to complete
      while (this.segmentingPages.has(cacheKey)) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return this.pageSegmentationCache.get(cacheKey);
    }

    console.log(
      `🔄 Starting background segmentation for pages ${startPage}-${endPage}`,
    );
    this.segmentingPages.add(cacheKey);

    try {
      // Calculate text range for these pages
      const words = textToUse.match(/\p{L}+|\p{P}+|\s+/gu) || [];
      const startIndex = startPage * wordsPerPage;
      const endIndex = Math.min((endPage + 1) * wordsPerPage, words.length);

      if (startIndex >= words.length) {
        return [];
      }

      const pageText = words.slice(startIndex, endIndex).join("");
      console.log(
        `Segmenting pages ${startPage}-${endPage} in 100-character chunks:`,
        pageText.substring(0, 100) + "...",
      );

      // Send text in 100-character chunks until we cover current + next page
      const allSegments = [];
      let chunkStart = 0;
      const chunkSize = 100;

      console.log(
        `Processing ${pageText.length} characters in ${chunkSize}-character chunks`,
      );

      while (chunkStart < pageText.length) {
        const chunkEnd = Math.min(chunkStart + chunkSize, pageText.length);
        const chunk = pageText.substring(chunkStart, chunkEnd);

        console.log(
          `Segmenting chunk ${Math.floor(chunkStart / chunkSize) + 1}: "${chunk.substring(0, 30)}..." (${chunk.length} chars)`,
        );

        const chunkSegmentation = await this.segmentChineseSentence(chunk);

        // Adjust positions to be relative to the entire page text
        const adjustedSegmentation = chunkSegmentation.map((segment) => ({
          ...segment,
          start: segment.start + chunkStart,
          end: segment.end + chunkStart,
        }));

        allSegments.push(...adjustedSegmentation);
        chunkStart = chunkEnd;

        console.log(`Processed ${chunkEnd}/${pageText.length} characters`);
      }

      // Cache the result
      this.pageSegmentationCache.set(cacheKey, allSegments);
      console.log(
        `Completed chunked segmentation for pages ${startPage}-${endPage}: ${allSegments.length} segments`,
      );

      return allSegments;
    } finally {
      this.segmentingPages.delete(cacheKey);
    }
  }

  // Main method called by LessonView - implements smart pagination
  async segmentChineseText(text, currentPage = 0, wordsPerPage = 300) {
    console.log(
      `Segmenting Chinese text for page ${currentPage} (${wordsPerPage} words per page)`,
    );

    // Segment current page + next page for smooth navigation
    const endPage = currentPage + 1;
    return await this.segmentPageRange(
      text,
      currentPage,
      endPage,
      wordsPerPage,
    );
  }

  // Pre-load next page when user navigates
  async preloadNextPage(text, currentPage, wordsPerPage) {
    const nextPage = currentPage + 1;
    console.log(`Pre-loading page ${nextPage} for smooth navigation`);

    // Don't await this - let it load in background
    this.segmentPageRange(text, nextPage, nextPage, wordsPerPage).catch(
      (error) => {
        console.log(`Pre-loading page ${nextPage} failed:`, error.message);
      },
    );
  }

  extractWordsFromSegmentation(segmentation) {
    return segmentation
      .filter((segment) => /\p{L}/u.test(segment.word)) // Only include segments with letters (words)
      .map((segment) => segment.word.toLowerCase());
  }

  handleApiFailure() {
    this.apiFailureCount++;
    this.lastFailureTime = Date.now();

    console.log(`API failure ${this.apiFailureCount}/${this.maxApiFailures}`);

    if (this.apiFailureCount >= this.maxApiFailures) {
      this.apiDisabled = true;
      console.log(
        `🚫 API disabled after ${this.maxApiFailures} consecutive failures. Using local segmentation only.`,
      );
    }
  }

  handleApiSuccess() {
    // Reset failure count on successful API call
    if (this.apiFailureCount > 0) {
      console.log("✅ API call successful, resetting failure count");
      this.apiFailureCount = 0;
      this.apiDisabled = false;
    }
  }

  // Allow manual re-enabling of API (can be called from console)
  resetApiCircuitBreaker() {
    this.apiFailureCount = 0;
    this.apiDisabled = false;
    this.lastFailureTime = null;
    console.log("🔄 API circuit breaker reset, API re-enabled");
  }

  // Initialize page tracking system
  initializePageTracking(totalPages, wordsPerPage) {
    console.log(
      `📊 Initializing page tracking: ${totalPages} pages, ${wordsPerPage} words per page`,
    );
    this.totalPages = totalPages;
    this.wordsPerPage = wordsPerPage;
    this.pageSegmentationStatus.clear();

    // Initialize all pages as pending
    for (let i = 0; i < totalPages; i++) {
      this.pageSegmentationStatus.set(i, "pending");
    }
  }

  // Set current viewed page and trigger background segmentation
  setCurrentPage(pageNumber) {
    this.currentViewedPage = pageNumber;
    console.log(
      `👁️ Viewing page ${pageNumber}, checking segmentation needs...`,
    );

    // Check if current page and next page need segmentation
    this.checkAndSegmentNeededPages();
  }

  // Check which pages need segmentation and start background processing
  checkAndSegmentNeededPages() {
    // Skip all background work if API is disabled
    if (this.apiDisabled || !this.model) {
      console.log(
        `🚫 API disabled/unavailable, marking all pages as completed with fallback`,
      );
      // Mark all pages as completed and generate fallback segmentation
      for (let i = 0; i < this.totalPages; i++) {
        if (this.pageSegmentationStatus.get(i) === "pending") {
          this.pageSegmentationStatus.set(i, "completed");
          // Generate fallback segmentation for this page and cache it
          this.generateFallbackSegmentationForPage(i);
          // Notify callback for immediate page
          if (i === this.currentViewedPage) {
            this.notifyPageSegmentationComplete(i);
          }
        }
      }
      return;
    }

    const pagesToSegment = [this.currentViewedPage];

    // Add next page if it exists
    if (this.currentViewedPage + 1 < this.totalPages) {
      pagesToSegment.push(this.currentViewedPage + 1);
    }

    for (const pageNum of pagesToSegment) {
      const status = this.pageSegmentationStatus.get(pageNum);
      if (status === "pending") {
        console.log(`🔄 Starting background segmentation for page ${pageNum}`);
        this.segmentPageInBackground(pageNum);
      } else if (status === "completed") {
        console.log(`✅ Page ${pageNum} already segmented`);
      } else if (status === "segmenting") {
        console.log(`⏳ Page ${pageNum} currently being segmented`);
      }
    }
  }

  // Background segmentation of a specific page
  async segmentPageInBackground(pageNumber) {
    // Always check circuit breaker first
    if (this.apiDisabled || !this.model) {
      console.log(
        `🚫 API disabled/unavailable, marking page ${pageNumber} as completed with fallback`,
      );
      this.pageSegmentationStatus.set(pageNumber, "completed");
      return;
    }

    this.pageSegmentationStatus.set(pageNumber, "segmenting");

    try {
      // This will use the existing segmentPageRange logic with 100-char chunks
      await this.segmentPageRange(
        null,
        pageNumber,
        pageNumber,
        this.wordsPerPage,
      );

      this.pageSegmentationStatus.set(pageNumber, "completed");
      console.log(`✅ Page ${pageNumber} segmentation completed`);

      // Notify UI that page is ready for re-render (could add callback here)
      this.notifyPageSegmentationComplete(pageNumber);
    } catch (error) {
      console.error(`❌ Page ${pageNumber} segmentation failed:`, error);

      // If this is a network error, trigger circuit breaker
      if (
        error.message.includes("Failed to fetch") ||
        error.name === "TypeError"
      ) {
        console.log(
          `🚫 Network error in background segmentation, disabling API`,
        );
        this.handleApiFailure();
      }

      this.pageSegmentationStatus.set(pageNumber, "failed");
    }
  }

  // Get segmentation status for a page
  getPageStatus(pageNumber) {
    return this.pageSegmentationStatus.get(pageNumber) || "pending";
  }

  // Get overall segmentation progress
  getSegmentationProgress() {
    const completed = Array.from(this.pageSegmentationStatus.values()).filter(
      (status) => status === "completed",
    ).length;
    return {
      completed,
      total: this.totalPages,
      percentage:
        this.totalPages > 0
          ? Math.round((completed / this.totalPages) * 100)
          : 0,
    };
  }

  // Check if current + next page are both segmented
  areCurrentPagesSegmented() {
    const currentStatus = this.getPageStatus(this.currentViewedPage);
    const nextStatus =
      this.currentViewedPage + 1 < this.totalPages
        ? this.getPageStatus(this.currentViewedPage + 1)
        : "completed";

    return currentStatus === "completed" && nextStatus === "completed";
  }

  // Notify UI when segmentation completes
  notifyPageSegmentationComplete(pageNumber) {
    console.log(`🔔 Page ${pageNumber} ready for enhanced display`);
    console.log(`🔔 Callback registered: ${!!this.onSegmentationComplete}`);

    // Call registered callback if available
    if (this.onSegmentationComplete) {
      console.log(`🔔 Calling callback for page ${pageNumber}`);
      this.onSegmentationComplete(pageNumber);
    } else {
      console.log(
        `❌ No callback registered to notify about page ${pageNumber} completion`,
      );
    }
  }

  // Set callback for segmentation completion notifications
  setSegmentationCompleteCallback(callback) {
    this.onSegmentationComplete = callback;
  }

  // Get cached segmentation for a page
  getPageSegmentation(pageNumber) {
    const cacheKey = `${pageNumber}-${pageNumber}-${this.wordsPerPage}`;
    return this.pageSegmentationCache.get(cacheKey);
  }

  // Generate fallback segmentation for a specific page
  generateFallbackSegmentationForPage(pageNumber) {
    if (!this.currentText) {
      console.log(
        `No current text available for fallback segmentation of page ${pageNumber}`,
      );
      return;
    }

    console.log(`🔄 Generating fallback segmentation for page ${pageNumber}`);

    // Calculate page text
    const words = this.currentText.match(/\p{L}+|\p{P}+|\s+/gu) || [];
    const startIndex = pageNumber * this.wordsPerPage;
    const endIndex = Math.min(
      (pageNumber + 1) * this.wordsPerPage,
      words.length,
    );

    if (startIndex >= words.length) {
      return;
    }

    const pageText = words.slice(startIndex, endIndex).join("");

    // Use fallback segmentation
    const segmentation = this.fallbackSegmentation(pageText);

    // Cache the result
    const cacheKey = `${pageNumber}-${pageNumber}-${this.wordsPerPage}`;
    this.pageSegmentationCache.set(cacheKey, segmentation);

    console.log(
      `✅ Generated fallback segmentation for page ${pageNumber}: ${segmentation.length} segments`,
    );
  }

  clearCache() {
    this.segmentationCache.clear();
    this.pageSegmentationCache.clear();
    this.segmentingPages.clear();
    this.pageSegmentationStatus.clear();
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
  console.log(
    "Use window.chineseSegmentationService.resetApiCircuitBreaker() to re-enable API if needed",
  );
}

export default chineseSegmentationService;
