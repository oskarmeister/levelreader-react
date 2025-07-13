const GOOGLE_TRANSLATE_API_KEY = "AIzaSyAyMJKwv27hThFGQjHOHqmuwlJYVrEveis";
const TRANSLATE_API_URL =
  "https://translation.googleapis.com/language/translate/v2";

const TranslationService = {
  async translateText(text, targetLang = "en", sourceLang = null) {
    try {
      const response = await fetch(
        `${TRANSLATE_API_URL}?key=${GOOGLE_TRANSLATE_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: text,
            target: targetLang,
            source: sourceLang,
            format: "text",
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();

      if (
        data.data &&
        data.data.translations &&
        data.data.translations.length > 0
      ) {
        return {
          translatedText: data.data.translations[0].translatedText,
          detectedSourceLanguage:
            data.data.translations[0].detectedSourceLanguage || sourceLang,
        };
      } else {
        throw new Error("No translation found");
      }
    } catch (error) {
      console.error("Translation error:", error);
      throw error;
    }
  },

  async detectLanguage(text) {
    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/detect/v2?key=${GOOGLE_TRANSLATE_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: text,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Language detection API error: ${response.status}`);
      }

      const data = await response.json();

      if (
        data.data &&
        data.data.detections &&
        data.data.detections.length > 0
      ) {
        return data.data.detections[0][0].language;
      } else {
        throw new Error("No language detected");
      }
    } catch (error) {
      console.error("Language detection error:", error);
      return "auto";
    }
  },
};

export default TranslationService;
