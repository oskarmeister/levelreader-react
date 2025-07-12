import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppContext from '../context/AppContext';

const Nav = () => {
  const { state } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'tab-library', label: 'Library', path: '/library' },
    { id: 'tab-wordbank', label: 'Word Bank', path: '/wordbank' },
    { id: 'tab-import', label: 'Import', path: '/import' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-secondary z-50 flex justify-between items-center p-2 shadow-md">
      <div className="logo text-white font-bold text-lg">📚 LevelReader</div>
      <div className="tabs flex">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`px-3 py-1 rounded mr-2 text-white ${location.pathname === tab.path ? 'bg-primary' : 'bg-gray-600 hover:bg-gray-500'}`}
            onClick={() => state.token ? navigate(tab.path) : navigate('/account')}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <button
        className="profile-btn flex items-center bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-500"
        onClick={() => navigate('/account')}
      >
        <span className="user-icon mr-1">👤</span>
        <span id="username-display">{state.username || 'Login'}</span>
      </button>
    </nav>
  );
};

export default Nav;