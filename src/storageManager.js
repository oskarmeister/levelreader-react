import { ApiManager } from './api/apiManager';

const StorageManager = {
  async save(state) {
    await ApiManager.saveUserData(state);
  }
};

export { StorageManager };