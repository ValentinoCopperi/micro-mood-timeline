import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { MoodEntry, MoodCategory, MoodLevel } from '@/types';
import { v4 as uuid } from 'uuid';

interface MoodState {
  // Current mood entries
  entries: MoodEntry[];
  // Pending entries (optimistic updates)
  pendingEntries: Map<string, MoodEntry>;
  // Loading states
  isLoading: boolean;
  isSyncing: boolean;
  // Error state
  error: string | null;
  // Last sync timestamp
  lastSyncAt: number | null;
}

interface MoodActions {
  // Add a new mood entry (optimistic)
  addEntry: (category: MoodCategory, level: MoodLevel, note?: string) => MoodEntry;
  // Update an entry (optimistic)
  updateEntry: (id: string, updates: Partial<Pick<MoodEntry, 'level' | 'category' | 'note'>>) => void;
  // Delete an entry (optimistic)
  deleteEntry: (id: string) => void;
  // Confirm a pending entry
  confirmEntry: (tempId: string, confirmedEntry: MoodEntry) => void;
  // Reject a pending entry (rollback)
  rejectEntry: (tempId: string, error: string) => void;
  // Set entries from server
  setEntries: (entries: MoodEntry[]) => void;
  // Add entry from realtime event
  addRealtimeEntry: (entry: MoodEntry) => void;
  // Set loading state
  setLoading: (loading: boolean) => void;
  // Set syncing state
  setSyncing: (syncing: boolean) => void;
  // Clear error
  clearError: () => void;
  // Get entries for a time range
  getEntriesInRange: (start: number, end: number) => MoodEntry[];
  // Get today's entries
  getTodayEntries: () => MoodEntry[];
}

type MoodStore = MoodState & MoodActions;

const getStartOfDay = (timestamp: number): number => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const getEndOfDay = (timestamp: number): number => {
  const date = new Date(timestamp);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
};

export const useMoodStore = create<MoodStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      entries: [],
      pendingEntries: new Map(),
      isLoading: false,
      isSyncing: false,
      error: null,
      lastSyncAt: null,

      // Actions
      addEntry: (category, level, note) => {
        const tempId = `temp-${uuid()}`;
        const entry: MoodEntry = {
          id: tempId,
          category,
          level,
          note,
          timestamp: Date.now(),
        };

        set((state) => {
          state.entries.unshift(entry);
          state.pendingEntries.set(tempId, entry);
        });

        return entry;
      },

      updateEntry: (id, updates) => {
        set((state) => {
          const index = state.entries.findIndex((e) => e.id === id);
          if (index !== -1) {
            Object.assign(state.entries[index], updates);
          }
        });
      },

      deleteEntry: (id) => {
        set((state) => {
          state.entries = state.entries.filter((e) => e.id !== id);
          state.pendingEntries.delete(id);
        });
      },

      confirmEntry: (tempId, confirmedEntry) => {
        set((state) => {
          const index = state.entries.findIndex((e) => e.id === tempId);
          if (index !== -1) {
            state.entries[index] = confirmedEntry;
          }
          state.pendingEntries.delete(tempId);
        });
      },

      rejectEntry: (tempId, error) => {
        set((state) => {
          state.entries = state.entries.filter((e) => e.id !== tempId);
          state.pendingEntries.delete(tempId);
          state.error = error;
        });
      },

      setEntries: (entries) => {
        set((state) => {
          state.entries = entries;
          state.lastSyncAt = Date.now();
          state.isLoading = false;
        });
      },

      addRealtimeEntry: (entry) => {
        set((state) => {
          // Avoid duplicates
          if (!state.entries.some((e) => e.id === entry.id)) {
            state.entries.unshift(entry);
          }
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setSyncing: (syncing) => set({ isSyncing: syncing }),
      clearError: () => set({ error: null }),

      getEntriesInRange: (start, end) => {
        return get().entries.filter(
          (entry) => entry.timestamp >= start && entry.timestamp <= end
        );
      },

      getTodayEntries: () => {
        const now = Date.now();
        const start = getStartOfDay(now);
        const end = getEndOfDay(now);
        return get().getEntriesInRange(start, end);
      },
    })),
    {
      name: 'micromood-entries',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        entries: state.entries.slice(0, 500), // Keep last 500 entries
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);

// Selectors
export const selectTodayEntries = (state: MoodStore) => state.getTodayEntries();
export const selectIsLoading = (state: MoodStore) => state.isLoading;
export const selectIsSyncing = (state: MoodStore) => state.isSyncing;
export const selectError = (state: MoodStore) => state.error;
export const selectRecentEntries = (limit: number) => (state: MoodStore) => 
  state.entries.slice(0, limit);

