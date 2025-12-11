// Core mood types
export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export type MoodCategory = 
  | 'calm'
  | 'happy'
  | 'energetic'
  | 'anxious'
  | 'tired'
  | 'focused'
  | 'stressed'
  | 'grateful';

export interface MoodEntry {
  id: string;
  level: MoodLevel;
  category: MoodCategory;
  note?: string;
  timestamp: number;
  userId?: string;
}

export interface MoodFilter {
  startDate?: number;
  endDate?: number;
  categories?: MoodCategory[];
  levels?: MoodLevel[];
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Settings types
export interface UserSettings {
  theme: Theme;
  enableRealtime: boolean;
  enableNotifications: boolean;
  quickMoodCategories: MoodCategory[];
  defaultMoodDuration: number; // in minutes
}

// API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Real-time event types
export type RealtimeEventType = 
  | 'mood:created'
  | 'mood:updated'
  | 'mood:deleted'
  | 'sync:complete';

export interface RealtimeEvent<T = unknown> {
  type: RealtimeEventType;
  payload: T;
  timestamp: number;
}

// Timeline visualization types
export interface TimelineSegment {
  startTime: number;
  endTime: number;
  mood: MoodEntry;
  color: string;
  intensity: number;
}

// Emoji mappings
export const MOOD_EMOJIS: Record<MoodCategory, string> = {
  calm: '😌',
  happy: '😊',
  energetic: '⚡',
  anxious: '😰',
  tired: '😴',
  focused: '🎯',
  stressed: '😤',
  grateful: '🙏',
};

export const MOOD_COLORS: Record<MoodCategory, string> = {
  calm: '#7DD3FC',
  happy: '#FCD34D',
  energetic: '#F97316',
  anxious: '#A78BFA',
  tired: '#94A3B8',
  focused: '#34D399',
  stressed: '#F87171',
  grateful: '#FB7185',
};

export const MOOD_LEVEL_LABELS: Record<MoodLevel, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Neutral',
  4: 'Good',
  5: 'Great',
};

