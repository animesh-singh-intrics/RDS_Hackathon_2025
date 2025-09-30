import { useState, useCallback } from 'react';
import type { ToolStatus, ToolState } from '../types/index.js';

/**
 * Generic hook for managing tool state
 */
export function useToolState<T>(initialData: T | null = null): ToolState<T> & {
  setData: (data: T | null) => void;
  setStatus: (status: ToolStatus) => void;
  setError: (error: string | null) => void;
  reset: () => void;
} {
  const [state, setState] = useState<ToolState<T>>({
    data: initialData,
    status: 'idle',
    error: null,
  });

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  const setStatus = useCallback((status: ToolStatus) => {
    setState(prev => ({ ...prev, status }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, status: error ? 'error' : 'idle' }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      status: 'idle',
      error: null,
    });
  }, [initialData]);

  return {
    ...state,
    setData,
    setStatus,
    setError,
    reset,
  };
}

/**
 * Hook for handling async operations with loading states
 */
export function useAsyncOperation<T>() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (
    operation: () => Promise<T>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await operation();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    execute,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}