import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AppContext from '../context/AppContext';
import { StorageManager } from '../storageManager';

const ImportView = () => {
  const { state, setState } = useContext(AppContext);
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        if (data.text) setText(data.text);
        else alert(data.error || 'Failed to extract text');
      })
      .catch(err => {
        console.error(err);
        const reader = new FileReader();
        reader.onload = (ev) => setText(ev.target.result);
        reader.readAsText(file);
      });
    }
  };

  const handleSave = async () => {
    if (title && text) {
      if (state.lessons[title]) return alert('Title already exists.');
      setState(prev => ({ ...prev, lessons: { ...prev.lessons, [title]: text } }));
      await StorageManager.save(state);
      navigate('/library');
    } else {
      alert('Title and text required.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Import Lesson</h2>
      <div className="flex flex-col items-center w-full">
        <label className="mb-1 text-white text-center">Add title (max 60 characters):</label>
        <input type="text" maxLength={60} value={title} onChange={e => setTitle(e.target.value)} className="w-1/2 p-4 mb-2 border rounded bg-white text-black text-xl text-center" />
        <label className="mb-1 text-white text-center">Add description (optional):</label>
        <textarea value={text} onChange={e => setText(e.target.value)} className="w-1/2 h-48 p-4 mb-2 border rounded bg-white text-black text-xl text-center" />
        <label className="mb-1 text-white text-center">Upload File:</label>
        <input type="file" onChange={handleFileChange} className="mb-2" />
        <button onClick={handleSave} className="px-5 py-2 bg-primary text-white rounded hover:bg-blue-600">Save and generate lesson</button>
      </div>
    </div>
  );
};

export default ImportView;