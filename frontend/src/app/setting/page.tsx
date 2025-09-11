'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('apiKey');
      if (savedKey) setApiKey(savedKey);
    }
  }, []);

  const handleSave = async () => {
    setError('');
    setSuccessMessage('');

    // Basic validation
    if (!apiKey || apiKey.trim().length < 10) {
      setError('Please enter a valid API key');
      return;
    }

    setLoading(true);

    try {
      // Try saving API key to backend
      const response = await axios.post(
        'http://localhost:4000/api/settings/save-api',
        { apiKey: apiKey.trim() }
      );

      if (response.status === 200) {
        setSuccessMessage('API key saved successfully in database ✅');
      } else {
        throw new Error('Failed to save in DB');
      }
    } catch (err) {
      console.error('DB save failed, falling back to localStorage', err);

      // Save in localStorage if backend fails
      localStorage.setItem('apiKey', apiKey.trim());
      setSuccessMessage('API key saved in localStorage ✅ (DB unavailable)');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setSuccessMessage('API key copied to clipboard ✅');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <label className="block mb-2 font-medium">API Key</label>
        <div className="flex gap-2 items-center">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="flex-1 p-3 border rounded-lg"
            placeholder="Enter your API key"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="text-sm text-blue-500 underline"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {successMessage && (
          <p className="text-green-500 text-sm mt-2">{successMessage}</p>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className={`flex-1 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>

          <button
            onClick={handleCopy}
            disabled={!apiKey}
            className="bg-gray-200 text-gray-800 p-2 rounded-lg hover:bg-gray-300"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
