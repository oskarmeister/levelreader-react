const BACKEND_URL = 'http://localhost:5000';

const ApiManager = {
  async fetchData(endpoint, method = 'GET', body = null, state) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.token}`
    };
    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);
    const response = await fetch(`${BACKEND_URL}${endpoint}`, config);
    if (response.status === 401) {
      alert('Session expired. Please login again.');
      // logout logic
      return null;
    }
    return await response.json();
  },
  async loadUserData(state, setState) {
    const data = await ApiManager.fetchData('/user_data', 'GET', null, state);
    if (data) {
      setState(prev => ({
        ...prev,
        lessons: data.lessons || {},
        wordMetadata: data.word_metadata || {},
        translationCache: data.translation_cache || {},
        deletedWords: data.deleted_words || []
      }));
    }
  },
  async saveUserData(state) {
    await ApiManager.fetchData('/user_data', 'POST', {
      lessons: state.lessons,
      word_metadata: state.wordMetadata,
      translation_cache: state.translationCache,
      deleted_words: state.deletedWords
    }, state);
  }
};

export { ApiManager };