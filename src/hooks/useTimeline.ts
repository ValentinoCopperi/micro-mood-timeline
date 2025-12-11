/**
 * useTimeline Hook
 * 
 * Manages the mood timeline visualization data.
 * Transforms mood entries into timeline segments with colors and animations.
 */

import { useMemo, useCallback } from 'react';
import { useTodayMoods } from '@/api/queries';
import type { MoodEntry, MoodCategory, TimelineSegment } from '@/types';
import { MOOD_COLORS } from '@/types';

interface UseTimelineOptions {
  // Time window in milliseconds (default: 24 hours)
  windowMs?: number;
  // Segment size in milliseconds (default: 30 minutes)
  segmentMs?: number;
  // Whether to include empty segments
  includeEmpty?: boolean;
}

interface TimelineData {
  segments: TimelineSegment[];
  currentMood: MoodEntry | null;
  moodCounts: Record<MoodCategory, number>;
  averageLevel: number;
  totalEntries: number;
  dominantMood: MoodCategory | null;
}

const DEFAULT_OPTIONS: Required<UseTimelineOptions> = {
  windowMs: 24 * 60 * 60 * 1000,
  segmentMs: 30 * 60 * 1000,
  includeEmpty: false,
};

export function useTimeline(options: UseTimelineOptions = {}): TimelineData & {
  isLoading: boolean;
  refetch: () => void;
} {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const { data, isLoading, refetch } = useTodayMoods();
  
  const entries = data?.data ?? [];

  const timelineData = useMemo((): TimelineData => {
    if (entries.length === 0) {
      return {
        segments: [],
        currentMood: null,
        moodCounts: {} as Record<MoodCategory, number>,
        averageLevel: 0,
        totalEntries: 0,
        dominantMood: null,
      };
    }

    // Sort entries by timestamp
    const sortedEntries = [...entries].sort((a, b) => a.timestamp - b.timestamp);
    
    // Get the current mood (most recent)
    const currentMood = sortedEntries[sortedEntries.length - 1];
    
    // Calculate mood counts and average
    const moodCounts = {} as Record<MoodCategory, number>;
    let levelSum = 0;
    
    sortedEntries.forEach((entry) => {
      moodCounts[entry.category] = (moodCounts[entry.category] || 0) + 1;
      levelSum += entry.level;
    });
    
    const averageLevel = sortedEntries.length > 0 
      ? levelSum / sortedEntries.length 
      : 0;
    
    // Find dominant mood
    let dominantMood: MoodCategory | null = null;
    let maxCount = 0;
    
    Object.entries(moodCounts).forEach(([category, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantMood = category as MoodCategory;
      }
    });

    // Create timeline segments
    const segments: TimelineSegment[] = sortedEntries.map((entry, index) => {
      const nextEntry = sortedEntries[index + 1];
      const endTime = nextEntry?.timestamp ?? Date.now();
      
      return {
        startTime: entry.timestamp,
        endTime,
        mood: entry,
        color: MOOD_COLORS[entry.category],
        intensity: entry.level / 5, // Normalize to 0-1
      };
    });

    return {
      segments,
      currentMood,
      moodCounts,
      averageLevel,
      totalEntries: sortedEntries.length,
      dominantMood,
    };
  }, [entries]);

  return {
    ...timelineData,
    isLoading,
    refetch,
  };
}

// Hook for getting color gradients based on mood flow
export function useTimelineGradient(segments: TimelineSegment[]): string {
  return useMemo(() => {
    if (segments.length === 0) {
      return 'linear-gradient(90deg, #94a3b8 0%, #94a3b8 100%)';
    }

    if (segments.length === 1) {
      return `linear-gradient(90deg, ${segments[0].color} 0%, ${segments[0].color} 100%)`;
    }

    const totalDuration = segments.reduce(
      (sum, seg) => sum + (seg.endTime - seg.startTime),
      0
    );

    const stops: string[] = [];
    let position = 0;

    segments.forEach((segment, index) => {
      const duration = segment.endTime - segment.startTime;
      const percentage = (duration / totalDuration) * 100;
      
      if (index === 0) {
        stops.push(`${segment.color} 0%`);
      }
      
      position += percentage;
      stops.push(`${segment.color} ${Math.min(100, position)}%`);
    });

    return `linear-gradient(90deg, ${stops.join(', ')})`;
  }, [segments]);
}

// Hook for mood flow animation data
export function useMoodFlow(entries: MoodEntry[]) {
  return useMemo(() => {
    const categories = Object.keys(MOOD_COLORS) as MoodCategory[];
    
    return categories.map((category) => {
      const categoryEntries = entries.filter((e) => e.category === category);
      return {
        category,
        color: MOOD_COLORS[category],
        count: categoryEntries.length,
        percentage: entries.length > 0 
          ? (categoryEntries.length / entries.length) * 100 
          : 0,
        averageLevel: categoryEntries.length > 0
          ? categoryEntries.reduce((sum, e) => sum + e.level, 0) / categoryEntries.length
          : 0,
      };
    }).filter((item) => item.count > 0);
  }, [entries]);
}

