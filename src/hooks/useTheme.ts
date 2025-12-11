/**
 * useTheme Hook
 * 
 * Manages theme state and provides utilities for theme switching.
 * Supports light, dark, and system (auto) themes.
 */

import { useCallback, useEffect } from 'react';
import { useSettingsStore, selectTheme, selectResolvedTheme } from '@/stores/settingsStore';
import type { Theme } from '@/types';

interface UseThemeReturn {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

export function useTheme(): UseThemeReturn {
  const theme = useSettingsStore(selectTheme);
  const resolvedTheme = useSettingsStore(selectResolvedTheme);
  const setTheme = useSettingsStore((state) => state.setTheme);

  // Apply theme to document on mount and changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  const toggleTheme = useCallback(() => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  }, [theme, setTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
  };
}

// Custom hook for theme-aware colors
export function useThemeColors() {
  const { isDark } = useTheme();

  return {
    bgPrimary: isDark ? '#0a0a0f' : '#fefefe',
    bgSecondary: isDark ? '#12121a' : '#f8f9fc',
    textPrimary: isDark ? '#f8fafc' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#475569',
    accent: isDark ? '#818cf8' : '#6366f1',
  };
}

