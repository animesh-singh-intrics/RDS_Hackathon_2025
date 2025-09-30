import { useState, useCallback, useEffect } from 'react';

/**
 * API key manager hook return type
 */
interface ApiKeyManagerReturn {
  readonly apiKey: string;
  readonly showApiKeyModal: boolean;
  readonly saveApiKey: (newApiKey: string) => void;
  readonly showApiKeyConfiguration: () => void;
  readonly hideApiKeyModal: () => void;
}

/**
 * Custom hook for managing Gemini API key storage and state
 * Follows React best practices for local storage interaction
 */
export const useApiKeyManager = (): ApiKeyManagerReturn => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);

  // Load API key from localStorage after component mounts
  useEffect(() => {
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const saveApiKey = useCallback((newApiKey: string): void => {
    setApiKey(newApiKey);
    setShowApiKeyModal(false);
    localStorage.setItem('geminiApiKey', newApiKey);
  }, []);

  const showApiKeyConfiguration = useCallback((): void => {
    setShowApiKeyModal(true);
  }, []);

  const hideApiKeyModal = useCallback((): void => {
    setShowApiKeyModal(false);
  }, []);

  return {
    apiKey,
    showApiKeyModal,
    saveApiKey,
    showApiKeyConfiguration,
    hideApiKeyModal
  } as const;
};