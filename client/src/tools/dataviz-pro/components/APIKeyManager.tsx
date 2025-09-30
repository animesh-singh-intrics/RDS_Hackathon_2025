import React, { useState, useEffect } from 'react';

interface APIKeyManagerProps {
  onApiKeySet: (apiKey: string) => void;
  isRequired?: boolean;
}

/**
 * API Key Manager Component
 * Allows users to enter and manage their OpenRouter API key
 */
export const APIKeyManager: React.FC<APIKeyManagerProps> = ({ 
  onApiKeySet, 
  isRequired = false 
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [hasValidKey, setHasValidKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // Check for existing API key in localStorage
    const savedKey = localStorage.getItem('openrouter_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setHasValidKey(true);
      onApiKeySet(savedKey);
    }
  }, [onApiKeySet]);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;

    setIsValidating(true);
    
    try {
      // Basic validation - check if it looks like a valid OpenRouter API key
      if (apiKey.length < 20) {
        throw new Error('API key seems too short');
      }

      // Save to localStorage and notify parent
      localStorage.setItem('openrouter_api_key', apiKey);
      setHasValidKey(true);
      onApiKeySet(apiKey);
      
      // Hide the input if not required to be always visible
      if (!isRequired) {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('API key validation failed:', error);
      alert('Invalid API key. Please check your OpenRouter API key and try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveApiKey = () => {
    localStorage.removeItem('openrouter_api_key');
    setApiKey('');
    setHasValidKey(false);
    setIsVisible(false);
    onApiKeySet('');
  };

  // Show API key input if required or if no valid key exists
  if (isRequired || !hasValidKey || isVisible) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-6 6c-1.053 0-2.036-.5-2.65-1.3L9 10.35A4.98 4.98 0 014 9c0-1.381.559-2.63 1.46-3.54L9 9l4.35-3.35c.77-.614 1.769-1 2.85-1z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900 mb-1">
              OpenRouter API Key Required
            </h3>
            <p className="text-sm text-blue-700 mb-4">
              To generate AI-powered dashboards, please enter your OpenRouter API key. 
              Your key is stored locally and never sent to our servers.
            </p>
            
            <div className="space-y-3">
              <div>
                <label htmlFor="api-key" className="sr-only">
                  OpenRouter API Key
                </label>
                <input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your OpenRouter API key (sk-or-...)"
                  className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSaveApiKey}
                  disabled={!apiKey.trim() || isValidating}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isValidating ? 'Validating...' : 'Save API Key'}
                </button>
                
                {hasValidKey && (
                  <button
                    onClick={handleRemoveApiKey}
                    className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Remove Key
                  </button>
                )}
                
                {!isRequired && (
                  <button
                    onClick={() => setIsVisible(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
            
            <div className="mt-4 text-xs text-blue-600">
              <p>
                <strong>Get your free API key:</strong>{' '}
                <a 
                  href="https://makersuite.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-800"
                >
                  Google AI Studio
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show compact status when API key is set
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium text-green-900">
            AI Dashboard Generation Enabled
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsVisible(true)}
            className="text-xs text-green-700 hover:text-green-900 underline"
          >
            Update Key
          </button>
          <button
            onClick={handleRemoveApiKey}
            className="text-xs text-red-600 hover:text-red-800 underline"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};