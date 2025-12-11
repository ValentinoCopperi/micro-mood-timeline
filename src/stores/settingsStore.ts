import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Theme, UserSettings, MoodCategory } from '@/types';
import { config } from '@/config';

interface SettingsState extends UserSettings {
  // Computed
  resolvedTheme: 'light' | 'dark';
}

interface SettingsActions {
  setTheme: (theme: Theme) => void;
  toggleRealtime: () => void;
  toggleNotifications: () => void;
  setQuickMoodCategories: (categories: MoodCategory[]) => void;
  addQuickMoodCategory: (category: MoodCategory) => void;
  removeQuickMoodCategory: (category: MoodCategory) => void;
  setDefaultMoodDuration: (minutes: number) => void;
  resetSettings: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

const DEFAULT_QUICK_CATEGORIES: MoodCategory[] = [
  'happy',
  'calm',
  'anxious',
  'tired',
  'focused',
  'stressed',
];

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

const defaultSettings: UserSettings = {
  theme: config.app.defaultTheme,
  enableRealtime: config.features.enableRealtime,
  enableNotifications: true,
  quickMoodCategories: DEFAULT_QUICK_CATEGORIES,
  defaultMoodDuration: 30,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...defaultSettings,
      resolvedTheme: resolveTheme(defaultSettings.theme),

      // Actions
      setTheme: (theme) => {
        const resolved = resolveTheme(theme);
        set({ theme, resolvedTheme: resolved });
        
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', resolved);
        document.documentElement.classList.toggle('dark', resolved === 'dark');
      },

      toggleRealtime: () => {
        set((state) => ({ enableRealtime: !state.enableRealtime }));
      },

      toggleNotifications: () => {
        set((state) => ({ enableNotifications: !state.enableNotifications }));
      },

      setQuickMoodCategories: (categories) => {
        set({ quickMoodCategories: categories });
      },

      addQuickMoodCategory: (category) => {
        const current = get().quickMoodCategories;
        if (!current.includes(category)) {
          set({ quickMoodCategories: [...current, category] });
        }
      },

      removeQuickMoodCategory: (category) => {
        set((state) => ({
          quickMoodCategories: state.quickMoodCategories.filter((c) => c !== category),
        }));
      },

      setDefaultMoodDuration: (minutes) => {
        set({ defaultMoodDuration: Math.max(1, Math.min(120, minutes)) });
      },

      resetSettings: () => {
        set({
          ...defaultSettings,
          resolvedTheme: resolveTheme(defaultSettings.theme),
        });
      },
    }),
    {
      name: 'micromood-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        enableRealtime: state.enableRealtime,
        enableNotifications: state.enableNotifications,
        quickMoodCategories: state.quickMoodCategories,
        defaultMoodDuration: state.defaultMoodDuration,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Apply theme on rehydration
          const resolved = resolveTheme(state.theme);
          state.resolvedTheme = resolved;
          document.documentElement.setAttribute('data-theme', resolved);
          document.documentElement.classList.toggle('dark', resolved === 'dark');
        }
      },
    }
  )
);

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const store = useSettingsStore.getState();
    if (store.theme === 'system') {
      store.setTheme('system');
    }
  });
}

// Selectors
export const selectTheme = (state: SettingsStore) => state.theme;
export const selectResolvedTheme = (state: SettingsStore) => state.resolvedTheme;
export const selectEnableRealtime = (state: SettingsStore) => state.enableRealtime;
export const selectQuickCategories = (state: SettingsStore) => state.quickMoodCategories;

