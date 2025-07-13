const BACKEND_URL = "http://localhost:5000";

const ApiManager = {
  isDevMode(token) {
    return token && token.startsWith("dev_token_");
  },

  async fetchData(endpoint, method = "GET", body = null, state) {
    // Skip API calls in dev mode
    if (this.isDevMode(state.token)) {
      return { success: true };
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.token}`,
    };
    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
      const response = await fetch(`${BACKEND_URL}${endpoint}`, config);
      if (response.status === 401) {
        alert("Session expired. Please login again.");
        return null;
      }
      return await response.json();
    } catch (error) {
      console.warn("API call failed, continuing in offline mode:", error);
      return { success: true };
    }
  },

  async loadUserData(state, setState) {
    // Skip loading in dev mode as data is already set
    if (this.isDevMode(state.token)) {
      return;
    }

    const data = await ApiManager.fetchData("/user_data", "GET", null, state);
    if (data) {
      setState((prev) => ({
        ...prev,
        lessons: data.lessons || {},
        wordMetadata: data.word_metadata || {},
        translationCache: data.translation_cache || {},
        deletedWords: data.deleted_words || [],
        lessonCategories: data.lesson_categories || {},
        recentlyAccessedLessons: data.recently_accessed_lessons || [],
        recentlyAccessedCategories: data.recently_accessed_categories || [],
      }));
    }
  },

  async saveUserData(state) {
    // In dev mode, just save to localStorage
    if (this.isDevMode(state.token)) {
      localStorage.setItem(
        "dev_data",
        JSON.stringify({
          selectedLanguage: state.selectedLanguage,
          languageData: state.languageData,
          // Legacy support for current language
          lessons: state.lessons,
          wordMetadata: state.wordMetadata,
          translationCache: state.translationCache,
          deletedWords: state.deletedWords,
          lessonCategories: state.lessonCategories,
          recentlyAccessedLessons: state.recentlyAccessedLessons,
          recentlyAccessedCategories: state.recentlyAccessedCategories,
        }),
      );
      return;
    }

    await ApiManager.fetchData(
      "/user_data",
      "POST",
      {
        selected_language: state.selectedLanguage,
        language_data: state.languageData,
        // Legacy fields for current language
        lessons: state.lessons,
        word_metadata: state.wordMetadata,
        translation_cache: state.translationCache,
        deleted_words: state.deletedWords,
        lesson_categories: state.lessonCategories,
        recently_accessed_lessons: state.recentlyAccessedLessons,
        recently_accessed_categories: state.recentlyAccessedCategories,
      },
      state,
    );
  },
};

export { ApiManager };
