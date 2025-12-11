import type { Theme } from '@/types';

export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  },
  features: {
    enableRealtime: import.meta.env.VITE_ENABLE_REALTIME !== 'false',
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'MicroMood',
    defaultTheme: (import.meta.env.VITE_DEFAULT_THEME || 'system') as Theme,
  },
  // Mood check-in reminder interval (in milliseconds)
  checkInInterval: 30 * 60 * 1000, // 30 minutes
  // Maximum entries to keep in local cache
  maxCacheEntries: 500,
  // Debounce delay for inputs
  debounceDelay: 300,
} as const;

export type Config = typeof config;

