import { config } from '@/config';
import type { ApiResponse, PaginatedResponse, MoodEntry, MoodFilter } from '@/types';

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  statusText: string;
  data?: unknown;

  constructor(status: number, statusText: string, data?: unknown) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

// Base fetch wrapper with error handling
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${config.api.baseUrl}${endpoint}`;
  
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Network error - simulate offline response
    throw new ApiError(0, 'Network Error');
  }
}

// Mood API endpoints
export const moodApi = {
  // Get all moods with optional filters
  getAll: async (filter?: MoodFilter): Promise<PaginatedResponse<MoodEntry>> => {
    const params = new URLSearchParams();
    if (filter?.startDate) params.set('startDate', String(filter.startDate));
    if (filter?.endDate) params.set('endDate', String(filter.endDate));
    if (filter?.categories?.length) params.set('categories', filter.categories.join(','));
    if (filter?.levels?.length) params.set('levels', filter.levels.join(','));
    
    const query = params.toString();
    return fetchApi<PaginatedResponse<MoodEntry>>(`/moods${query ? `?${query}` : ''}`);
  },

  // Get a single mood entry
  getById: async (id: string): Promise<ApiResponse<MoodEntry>> => {
    return fetchApi<ApiResponse<MoodEntry>>(`/moods/${id}`);
  },

  // Create a new mood entry
  create: async (entry: Omit<MoodEntry, 'id'>): Promise<ApiResponse<MoodEntry>> => {
    return fetchApi<ApiResponse<MoodEntry>>('/moods', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },

  // Update a mood entry
  update: async (
    id: string,
    updates: Partial<MoodEntry>
  ): Promise<ApiResponse<MoodEntry>> => {
    return fetchApi<ApiResponse<MoodEntry>>(`/moods/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  // Delete a mood entry
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return fetchApi<ApiResponse<void>>(`/moods/${id}`, {
      method: 'DELETE',
    });
  },

  // Get today's entries
  getToday: async (): Promise<ApiResponse<MoodEntry[]>> => {
    return fetchApi<ApiResponse<MoodEntry[]>>('/moods/today');
  },

  // Get mood statistics
  getStats: async (
    startDate: number,
    endDate: number
  ): Promise<ApiResponse<{ average: number; count: number; byCategory: Record<string, number> }>> => {
    return fetchApi(`/moods/stats?startDate=${startDate}&endDate=${endDate}`);
  },
};

// Export the base client for custom requests
export { fetchApi };

