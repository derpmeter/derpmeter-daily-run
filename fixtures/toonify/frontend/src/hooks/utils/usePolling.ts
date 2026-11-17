'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * A generic polling hook that repeatedly calls a check function until completion or timeout.
 * 
 * @example
 * const { isPolling, data, startPolling, stopPolling } = usePolling(
 *   async () => {
 *     const res = await api.get(`/resource/${id}`);
 *     return {
 *       done: res.data.status === 'completed',
 *       data: res.data
 *     };
 *   },
 *   { interval: 2000, maxAttempts: 30 }
 * );
 */

interface UsePollingOptions {
  /** Polling interval in milliseconds (default: 2000) */
  interval?: number;
  /** Maximum number of poll attempts before timeout (default: 30) */
  maxAttempts?: number;
  /** Callback when polling completes successfully */
  onComplete?: () => void;
  /** Callback when polling times out */
  onTimeout?: () => void;
  /** Callback on each poll error */
  onError?: (error: Error) => void;
  /** Whether to start polling immediately */
  immediate?: boolean;
}

interface PollingResult<T> {
  done: boolean;
  data?: T;
}

export function usePolling<T>(
  checkFn: () => Promise<PollingResult<T>>,
  options: UsePollingOptions = {}
) {
  const {
    interval = 2000,
    maxAttempts = 30,
    onComplete,
    onTimeout,
    onError,
    immediate = false,
  } = options;

  const [isPolling, setIsPolling] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const checkFnRef = useRef(checkFn);

  // Keep checkFn reference updated
  useEffect(() => {
    checkFnRef.current = checkFn;
  }, [checkFn]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const poll = useCallback(async (currentAttempt: number) => {
    if (!isMountedRef.current) return;

    try {
      const result = await checkFnRef.current();

      if (!isMountedRef.current) return;

      if (result.done) {
        setData(result.data ?? null);
        setIsPolling(false);
        setError(null);
        onComplete?.();
        return;
      }

      if (currentAttempt >= maxAttempts) {
        setIsPolling(false);
        onTimeout?.();
        return;
      }

      setAttempts(currentAttempt + 1);
      timeoutRef.current = setTimeout(() => poll(currentAttempt + 1), interval);
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const error = err as Error;
      setError(error);
      onError?.(error);
      
      // Continue polling on error (unless it's a critical error)
      if (currentAttempt < maxAttempts) {
        setAttempts(currentAttempt + 1);
        timeoutRef.current = setTimeout(() => poll(currentAttempt + 1), interval);
      } else {
        setIsPolling(false);
        onTimeout?.();
      }
    }
  }, [interval, maxAttempts, onComplete, onTimeout, onError]);

  const startPolling = useCallback(() => {
    setIsPolling(true);
    setAttempts(0);
    setError(null);
    poll(0);
  }, [poll]);

  const reset = useCallback(() => {
    stopPolling();
    setData(null);
    setAttempts(0);
    setError(null);
  }, [stopPolling]);

  // Handle immediate start
  useEffect(() => {
    if (immediate) {
      startPolling();
    }
  }, [immediate, startPolling]);

  return {
    isPolling,
    data,
    attempts,
    error,
    startPolling,
    stopPolling,
    reset,
  };
}
