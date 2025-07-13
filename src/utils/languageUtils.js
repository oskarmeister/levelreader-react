// Helper functions for managing multi-language data

export const updateLanguageData = (state, setState, updates) => {
  setState((prev) => {
    const updatedLanguageData = {
      ...prev.languageData,
      [prev.selectedLanguage]: {
        ...prev.languageData[prev.selectedLanguage],
        ...updates,
      },
    };

    const currentData = updatedLanguageData[prev.selectedLanguage];

    return {
      ...prev,
      languageData: updatedLanguageData,
      // Sync to legacy properties
      lessons: currentData.lessons,
      lessonCategories: currentData.lessonCategories,
      recentlyAccessedLessons: currentData.recentlyAccessedLessons,
      recentlyAccessedCategories: currentData.recentlyAccessedCategories,
      wordMetadata: currentData.wordMetadata,
      translationCache: currentData.translationCache,
      deletedWords: currentData.deletedWords,
    };
  });
};

export const getCurrentLanguageData = (state) => {
  return (
    state.languageData[state.selectedLanguage] || {
      lessons: {},
      lessonCategories: {},
      recentlyAccessedLessons: [],
      recentlyAccessedCategories: [],
      wordMetadata: {},
      translationCache: {},
      deletedWords: [],
    }
  );
};

export const getLanguageCode = (languageName) => {
  const languageCodes = {
    Spanish: "es",
    Swedish: "sv",
    Chinese: "zh",
    English: "en",
    German: "de",
    French: "fr",
  };
  return languageCodes[languageName] || "en";
};
