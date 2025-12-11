/**
 * Mock Server Simulation
 * 
 * This module simulates a backend server for development.
 * It provides:
 * - In-memory data storage
 * - SSE (Server-Sent Events) simulation for real-time updates
 * - Realistic network delays
 * - Persistence to localStorage
 */

import type { MoodEntry, MoodFilter, ApiResponse, PaginatedResponse, RealtimeEvent } from '@/types';
import { v4 as uuid } from 'uuid';

// Simulated delay range (ms)
const MIN_DELAY = 100;
const MAX_DELAY = 400;

const delay = (ms?: number) => 
  new Promise(resolve => setTimeout(resolve, ms ?? Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY));

// In-memory storage with localStorage persistence
const STORAGE_KEY = 'micromood-mock-db';

interface MockDatabase {
  moods: MoodEntry[];
}

const loadDatabase = (): MockDatabase => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // Ignore parse errors
  }
  return { moods: [] };
};

const saveDatabase = (db: MockDatabase) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

let database = loadDatabase();

// Event emitter for SSE simulation
type EventCallback = (event: RealtimeEvent) => void;
const eventListeners = new Set<EventCallback>();

export const mockEventEmitter = {
  subscribe: (callback: EventCallback) => {
    eventListeners.add(callback);
    return () => eventListeners.delete(callback);
  },
  emit: (event: RealtimeEvent) => {
    eventListeners.forEach(cb => cb(event));
  },
};

// Mock API implementation
export const mockServer = {
  moods: {
    getAll: async (filter?: MoodFilter): Promise<PaginatedResponse<MoodEntry>> => {
      await delay();
      
      let moods = [...database.moods];
      
      // Apply filters
      if (filter?.startDate) {
        moods = moods.filter(m => m.timestamp >= filter.startDate!);
      }
      if (filter?.endDate) {
        moods = moods.filter(m => m.timestamp <= filter.endDate!);
      }
      if (filter?.categories?.length) {
        moods = moods.filter(m => filter.categories!.includes(m.category));
      }
      if (filter?.levels?.length) {
        moods = moods.filter(m => filter.levels!.includes(m.level));
      }
      
      // Sort by timestamp descending
      moods.sort((a, b) => b.timestamp - a.timestamp);
      
      return {
        data: moods,
        success: true,
        timestamp: Date.now(),
        total: moods.length,
        page: 1,
        pageSize: moods.length,
        hasMore: false,
      };
    },

    getById: async (id: string): Promise<ApiResponse<MoodEntry>> => {
      await delay();
      const mood = database.moods.find(m => m.id === id);
      
      if (!mood) {
        throw new Error('Mood not found');
      }
      
      return {
        data: mood,
        success: true,
        timestamp: Date.now(),
      };
    },

    create: async (entry: Omit<MoodEntry, 'id'>): Promise<ApiResponse<MoodEntry>> => {
      await delay();
      
      const newMood: MoodEntry = {
        ...entry,
        id: uuid(),
      };
      
      database.moods.unshift(newMood);
      saveDatabase(database);
      
      // Emit real-time event
      mockEventEmitter.emit({
        type: 'mood:created',
        payload: newMood,
        timestamp: Date.now(),
      });
      
      return {
        data: newMood,
        success: true,
        timestamp: Date.now(),
      };
    },

    update: async (id: string, updates: Partial<MoodEntry>): Promise<ApiResponse<MoodEntry>> => {
      await delay();
      
      const index = database.moods.findIndex(m => m.id === id);
      if (index === -1) {
        throw new Error('Mood not found');
      }
      
      database.moods[index] = { ...database.moods[index], ...updates };
      saveDatabase(database);
      
      // Emit real-time event
      mockEventEmitter.emit({
        type: 'mood:updated',
        payload: database.moods[index],
        timestamp: Date.now(),
      });
      
      return {
        data: database.moods[index],
        success: true,
        timestamp: Date.now(),
      };
    },

    delete: async (id: string): Promise<ApiResponse<void>> => {
      await delay();
      
      const index = database.moods.findIndex(m => m.id === id);
      if (index === -1) {
        throw new Error('Mood not found');
      }
      
      database.moods.splice(index, 1);
      saveDatabase(database);
      
      // Emit real-time event
      mockEventEmitter.emit({
        type: 'mood:deleted',
        payload: { id },
        timestamp: Date.now(),
      });
      
      return {
        data: undefined,
        success: true,
        timestamp: Date.now(),
      };
    },

    getToday: async (): Promise<ApiResponse<MoodEntry[]>> => {
      await delay();
      
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;
      
      const todayMoods = database.moods
        .filter(m => m.timestamp >= startOfDay && m.timestamp <= endOfDay)
        .sort((a, b) => b.timestamp - a.timestamp);
      
      return {
        data: todayMoods,
        success: true,
        timestamp: Date.now(),
      };
    },

    getStats: async (startDate: number, endDate: number) => {
      await delay();
      
      const moods = database.moods.filter(
        m => m.timestamp >= startDate && m.timestamp <= endDate
      );
      
      const byCategory: Record<string, number> = {};
      let total = 0;
      
      moods.forEach(m => {
        byCategory[m.category] = (byCategory[m.category] || 0) + 1;
        total += m.level;
      });
      
      return {
        data: {
          average: moods.length ? total / moods.length : 0,
          count: moods.length,
          byCategory,
        },
        success: true,
        timestamp: Date.now(),
      };
    },
  },

  // Reset the mock database
  reset: () => {
    database = { moods: [] };
    saveDatabase(database);
  },

  // Seed with sample data
  seed: (entries: MoodEntry[]) => {
    database.moods = entries;
    saveDatabase(database);
  },
};

// Generate sample data for development
export const generateSampleData = (): MoodEntry[] => {
  const categories = ['calm', 'happy', 'energetic', 'anxious', 'tired', 'focused', 'stressed', 'grateful'] as const;
  const entries: MoodEntry[] = [];
  const now = Date.now();
  
  // Generate entries for the past 7 days
  for (let day = 0; day < 7; day++) {
    const entriesPerDay = Math.floor(Math.random() * 5) + 3;
    
    for (let i = 0; i < entriesPerDay; i++) {
      const dayStart = now - day * 24 * 60 * 60 * 1000;
      const randomHour = Math.floor(Math.random() * 14) + 7; // 7am to 9pm
      const timestamp = dayStart - (24 - randomHour) * 60 * 60 * 1000;
      
      entries.push({
        id: uuid(),
        category: categories[Math.floor(Math.random() * categories.length)],
        level: (Math.floor(Math.random() * 5) + 1) as 1 | 2 | 3 | 4 | 5,
        timestamp,
        note: Math.random() > 0.7 ? 'Quick check-in' : undefined,
      });
    }
  }
  
  return entries.sort((a, b) => b.timestamp - a.timestamp);
};

