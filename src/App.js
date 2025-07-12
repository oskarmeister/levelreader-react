import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Nav from './components/Nav';
import AccountView from './components/AccountView';
import LibraryView from './components/LibraryView';
import WordBankView from './components/WordBankView';
import ImportView from './components/ImportView';
import LessonView from './components/LessonView';
import EditView from './components/EditView';
import Sidebar from './components/Sidebar';
import AppContext from './context/AppContext';
import { ApiManager } from './api/apiManager';

function App() {
  const [state, setState] = useState({
    token: localStorage.getItem('token'),
    lessons: {},
    wordMetadata: {},
    translationCache: {},
    deletedWords: [],
    filterValue: 'all',
    currentText: '',
    editingKey: '',
    currentPage: 0,
    currentMode: 'page',
    sidebarOpen: false,
    selectedWord: '',
    username: localStorage.getItem('username') || ''
  });

  useEffect(() => {
    if (state.token) {
      ApiManager.loadUserData(state, setState);
    }
  }, [state.token]);

  return (
    <AppContext.Provider value={{ state, setState }}>
      <Router>
        <div className="min-h-screen bg-background">
          <Nav />
          <main className="pt-16 pb-16">  {/* Padding for fixed nav and bottom controls */}
            <Routes>
              <Route path="/account" element={<AccountView />} />
              <Route path="/library" element={<LibraryView />} />
              <Route path="/wordbank" element={<WordBankView />} />
              <Route path="/import" element={<ImportView />} />
              <Route path="/lesson/:key" element={<LessonView />} />
              <Route path="/edit/:key" element={<EditView />} />
              <Route path="/" element={state.token ? <Navigate to="/library" /> : <Navigate to="/account" />} />
            </Routes>
          </main>
          <Sidebar />
        </div>
      </Router>
    </AppContext.Provider>
  );
}

export default App;