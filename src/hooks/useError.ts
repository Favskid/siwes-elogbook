/**
 * useError Hook - Manages error state and provides user-friendly error handling
 */

import { useState, useCallback } from 'react';
import { parseApiError, getDisplayMessage, ApiError, isCriticalError } from '../utils/errorHandler';

export interface ErrorState {
  error: ApiError | null;
  message: string;
  isVisible: boolean;
  fieldErrors: Record<string, string>;
}

export function useError() {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    message: '',
    isVisible: false,
    fieldErrors: {}
  });

  /**
   * Handle API error and display user-friendly message
   */
  const handleError = useCallback((error: any) => {
    const parsed = parseApiError(error);
    const message = getDisplayMessage(parsed);
    
    const fieldErrors: Record<string, string> = {};
    if (parsed.details && typeof parsed.details === 'object') {
      Object.entries(parsed.details).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          fieldErrors[key] = value[0];
        } else if (typeof value === 'string') {
          fieldErrors[key] = value;
        }
      });
    }

    setErrorState({
      error: parsed,
      message,
      isVisible: true,
      fieldErrors
    });

    // Autohide after 6 seconds (unless critical)
    if (!isCriticalError(parsed)) {
      setTimeout(() => clearError(), 6000);
    }

    return parsed;
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      message: '',
      isVisible: false,
      fieldErrors: {}
    });
  }, []);

  /**
   * Set custom error message
   */
  const setError = useCallback((message: string) => {
    setErrorState({
      error: null,
      message,
      isVisible: true,
      fieldErrors: {}
    });

    setTimeout(() => clearError(), 6000);
  }, [clearError]);

  /**
   * Get error message for a specific field
   */
  const getFieldErrorMessage = useCallback((field: string): string | null => {
    return errorState.fieldErrors[field] || null;
  }, [errorState.fieldErrors]);

  return {
    ...errorState,
    handleError,
    clearError,
    setError,
    getFieldErrorMessage
  };
}
