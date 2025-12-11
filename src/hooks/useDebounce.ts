/**
 * useDebounce Hook
 * 
 * Provides debounced values and callbacks for input handling.
 * Helps prevent excessive API calls or expensive computations.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { config } from '@/config';

/**
 * Debounce a value - returns the value after a delay
 */
export function useDebounce<T>(value: T, delay: number = config.debounceDelay): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce a callback function
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number = config.debounceDelay
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

/**
 * Debounced state hook - combines useState with debouncing
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = config.debounceDelay
): [T, T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const debouncedValue = useDebounce(value, delay);

  return [value, debouncedValue, setValue];
}

