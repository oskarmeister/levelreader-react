import React, { useContext } from 'react';
import AppContext from '../context/AppContext';
import { StorageManager } from '../storageManager';

const WordBankView = () => {
  const { state, setState } = useContext(AppContext);

  const buttons = ['all', '1', '2', '3', 'known'];

  const handleFilter = (val) => {
    setState(prev => ({ ...prev, filterValue: val }));
  };

  const populateWordBank = () => {
    return Object.entries(state.wordMetadata).sort((a, b) => a[0].localeCompare(b[0])).map(([word, m]) => {
      if (state.filterValue !== 'all' && m.fam !== state.filterValue) return null;
      return (
        <li key={word} className="flex items-center bg-white border rounded p-2 mb-2">
          <span className="font-bold flex-1">{word}</span>
          <span className="flex-1 text-gray-800">{m.translation || 'No translation'}</span>
          <div className="flex gap-1">
            {['0', '1', '2', '3', 'known'].map(val => (
              <button
                key={val}
                className={`w-9 h-9 rounded-full ${val === '0' && (state.deletedWords.includes(word) ? 'bg-red-500 text-white' : 'bg-gray-300')} ${(val !== '0' && m.fam === val) ? 'bg-primary text-white' : ''}`}
                onClick={async () => {
                  if (val === '0') {
                    if (!state.deletedWords.includes(word)) {
                      setState(prev => ({ ...prev, deletedWords: [...prev.deletedWords, word] }));
                      delete state.wordMetadata[word];
                    }
                  } else {
                    setState(prev => ({
                      ...prev,
                      deletedWords: prev.deletedWords.filter(w => w !== word),
                      wordMetadata: { ...prev.wordMetadata, [word]: { translation: m.translation, fam: val } }
                    }));
                  }
                  await StorageManager.save(state);
                }}
              >
                {val === '0' ? '🗑️' : val === 'known' ? '✓' : val}
              </button>
            ))}
          </div>
        </li>
      );
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">🔤 Word Bank</h2>
      <div className="filter-container mb-4 text-right">
        Filter:
        {buttons.map(btn => (
          <button key={btn} className={`ml-2 px-3 py-1 rounded ${state.filterValue === btn ? 'bg-primary text-white' : 'bg-gray-200'}`} onClick={() => handleFilter(btn)}>
            {btn === 'known' ? '✓' : btn}
          </button>
        ))}
      </div>
      <ul className="list-none p-0">{populateWordBank()}</ul>
    </div>
  );
};

export default WordBankView;