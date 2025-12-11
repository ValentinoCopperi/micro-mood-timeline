/**
 * React Query hooks and query configuration
 * 
 * This module provides:
 * - Query keys for cache management
 * - Custom hooks for mood data fetching
 * - Mutation hooks with optimistic updates
 * - Suspense-enabled queries
 */

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  useSuspenseQuery,
  type QueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { mockServer, generateSampleData } from './mockServer';
import { useMoodStore } from '@/stores/moodStore';
import type { MoodEntry, MoodFilter, MoodCategory, MoodLevel } from '@/types';
import { v4 as uuid } from 'uuid';

// Query key factory for type-safe cache keys
export const queryKeys = {
  all: ['moods'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters: MoodFilter) => [...queryKeys.lists(), filters] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  detail: (id: string) => [...queryKeys.details(), id] as const,
  today: () => [...queryKeys.all, 'today'] as const,
  stats: (startDate: number, endDate: number) => 
    [...queryKeys.all, 'stats', startDate, endDate] as const,
};

// Initialize sample data if empty
const initSampleData = async () => {
  const response = await mockServer.moods.getAll();
  if (response.data.length === 0) {
    const sampleData = generateSampleData();
    mockServer.seed(sampleData);
  }
};

// Initialize on first import
initSampleData();

// Stale time and cache configuration
const STALE_TIME = 30 * 1000; // 30 seconds
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

// Hook: Fetch all moods with filters
export function useMoods(filter?: MoodFilter, options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: queryKeys.list(filter ?? {}),
    queryFn: () => mockServer.moods.getAll(filter),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    ...options,
  });
}

// Hook: Fetch moods with Suspense support
export function useMoodsSuspense(filter?: MoodFilter) {
  return useSuspenseQuery({
    queryKey: queryKeys.list(filter ?? {}),
    queryFn: () => mockServer.moods.getAll(filter),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

// Hook: Fetch today's moods
export function useTodayMoods() {
  return useQuery({
    queryKey: queryKeys.today(),
    queryFn: () => mockServer.moods.getToday(),
    staleTime: STALE_TIME,
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

// Hook: Fetch today's moods with Suspense
export function useTodayMoodsSuspense() {
  return useSuspenseQuery({
    queryKey: queryKeys.today(),
    queryFn: () => mockServer.moods.getToday(),
    staleTime: STALE_TIME,
  });
}

// Hook: Fetch single mood
export function useMood(id: string) {
  return useQuery({
    queryKey: queryKeys.detail(id),
    queryFn: () => mockServer.moods.getById(id),
    enabled: !!id,
  });
}

// Hook: Fetch mood statistics
export function useMoodStats(startDate: number, endDate: number) {
  return useQuery({
    queryKey: queryKeys.stats(startDate, endDate),
    queryFn: () => mockServer.moods.getStats(startDate, endDate),
    staleTime: STALE_TIME,
  });
}

// Hook: Create mood with optimistic update
export function useCreateMood() {
  const queryClient = useQueryClient();
  const addEntry = useMoodStore((state) => state.addEntry);
  const confirmEntry = useMoodStore((state) => state.confirmEntry);
  const rejectEntry = useMoodStore((state) => state.rejectEntry);

  return useMutation({
    mutationFn: async (data: { category: MoodCategory; level: MoodLevel; note?: string }) => {
      return mockServer.moods.create({
        ...data,
        timestamp: Date.now(),
      });
    },
    onMutate: async (data) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.today() });

      // Create optimistic entry
      const tempId = `temp-${uuid()}`;
      const optimisticEntry: MoodEntry = {
        id: tempId,
        ...data,
        timestamp: Date.now(),
      };

      // Update Zustand store optimistically
      addEntry(data.category, data.level, data.note);

      // Snapshot previous values
      const previousMoods = queryClient.getQueryData(queryKeys.today());
      const previousList = queryClient.getQueryData(queryKeys.lists());

      // Optimistically update cache
      queryClient.setQueryData(queryKeys.today(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: [optimisticEntry, ...old.data],
        };
      });

      return { previousMoods, previousList, tempId };
    },
    onSuccess: (response, _variables, context) => {
      // Confirm the entry with real ID
      if (context?.tempId) {
        confirmEntry(context.tempId, response.data);
      }
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousMoods) {
        queryClient.setQueryData(queryKeys.today(), context.previousMoods);
      }
      if (context?.tempId) {
        rejectEntry(context.tempId, 'Failed to create mood entry');
      }
    },
    onSettled: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.today() });
    },
  });
}

// Hook: Update mood with optimistic update
export function useUpdateMood() {
  const queryClient = useQueryClient();
  const updateEntry = useMoodStore((state) => state.updateEntry);

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<MoodEntry>) => {
      return mockServer.moods.update(id, updates);
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.detail(id) });

      const previousMood = queryClient.getQueryData(queryKeys.detail(id));

      // Optimistic update in store
      updateEntry(id, updates);

      // Optimistic update in cache
      queryClient.setQueryData(queryKeys.detail(id), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: { ...old.data, ...updates },
        };
      });

      return { previousMood };
    },
    onError: (_error, { id }, context) => {
      if (context?.previousMood) {
        queryClient.setQueryData(queryKeys.detail(id), context.previousMood);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.today() });
    },
  });
}

// Hook: Delete mood with optimistic update
export function useDeleteMood() {
  const queryClient = useQueryClient();
  const deleteEntry = useMoodStore((state) => state.deleteEntry);

  return useMutation({
    mutationFn: async (id: string) => {
      return mockServer.moods.delete(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.today() });

      const previousMoods = queryClient.getQueryData(queryKeys.today());

      // Optimistic delete
      deleteEntry(id);

      queryClient.setQueryData(queryKeys.today(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((m: MoodEntry) => m.id !== id),
        };
      });

      return { previousMoods };
    },
    onError: (_error, _id, context) => {
      if (context?.previousMoods) {
        queryClient.setQueryData(queryKeys.today(), context.previousMoods);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.today() });
    },
  });
}

// Prefetch function for SSR-like behavior
export const prefetchMoods = async (queryClient: QueryClient, filter?: MoodFilter) => {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.list(filter ?? {}),
    queryFn: () => mockServer.moods.getAll(filter),
  });
};

