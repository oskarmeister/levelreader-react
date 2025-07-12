import React, { useState, useContext } from 'react';
import AppContext from '../context/AppContext';
import { ApiManager } from '../api/apiManager';

const AccountView = () => {
  const { state, setState } = useContext(AppContext);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const response = await fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.token) {
      setState(prev => ({ ...prev, token: data.token, username }));
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', username);
      await ApiManager.loadUserData(state, setState);
      // Navigate to library
      window.location.href = '/library';
    } else {
      alert(data.error || 'Login failed');
    }
  };

  const handleSignup = async () => {
    const response = await fetch('http://localhost:5000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password })
    });
    const data = await response.json();
    if (data.success) {
      alert('Signup successful. Please login.');
      setIsSignup(false);
    } else {
      alert(data.error || 'Signup failed');
    }
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, token: null, username: '', lessons: {}, wordMetadata: {}, translationCache: {}, deletedWords: [] }));
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md">
      {state.token ? (
        <button onClick={handleLogout} className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600">
          Logout
        </button>
      ) : isSignup ? (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-center">Sign Up</h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
          />
          <button onClick={handleSignup} className="w-full bg-primary text-white py-2 rounded hover:bg-blue-600">
            Sign Up
          </button>
          <p className="text-center mt-2">
            Already have an account? <a href="#" onClick={() => setIsSignup(false)} className="text-primary hover:underline">Login</a>
          </p>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
          />
          <button onClick={handleLogin} className="w-full bg-primary text-white py-2 rounded hover:bg-blue-600">
            Login
          </button>
          <p className="text-center mt-2">
            Don't have an account? <a href="#" onClick={() => setIsSignup(true)} className="text-primary hover:underline">Sign up</a>
          </p>
        </div>
      )}
    </div>
  );
};

export default AccountView;