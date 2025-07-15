import { ApiManager } from "./api/apiManager";

const StorageManager = {
  async save(state) {
    // Update the current language data in languageData structure
    const updatedState = {
      ...state,
      languageData: {
        ...state.languageData,
        [state.selectedLanguage]: {
          lessons: state.lessons,
          lessonCategories: state.lessonCategories,
          recentlyAccessedLessons: state.recentlyAccessedLessons,
          recentlyAccessedCategories: state.recentlyAccessedCategories,
          wordMetadata: state.wordMetadata,
          translationCache: state.translationCache,
          deletedWords: state.deletedWords,
          lessonSegmentations: state.lessonSegmentations,
        },
      },
    };

    await ApiManager.saveUserData(updatedState);
  },
};

export { StorageManager };
