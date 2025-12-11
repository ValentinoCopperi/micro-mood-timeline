/**
 * useMoodSync Hook
 * 
 * Manages real-time synchronization of mood entries using
 * Server-Sent Events (SSE) simulation.
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { mockEventEmitter } from '@/api/mockServer';
import { queryKeys } from '@/api/queries';
import { useMoodStore } from '@/stores/moodStore';
import { useSettingsStore, selectEnableRealtime } from '@/stores/settingsStore';
import type { RealtimeEvent, MoodEntry } from '@/types';

interface UseMoodSyncOptions {
  // Whether to enable syncing (overrides global setting)
  enabled?: boolean;
  // Callback when a new mood is received
  onMoodReceived?: (mood: MoodEntry) => void;
  // Callback on sync errors
  onError?: (error: Error) => void;
}

interface UseMoodSyncReturn {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncAt: number | null;
  connect: () => void;
  disconnect: () => void;
  sync: () => Promise<void>;
}

export function useMoodSync(options: UseMoodSyncOptions = {}): UseMoodSyncReturn {
  const { onMoodReceived, onError } = options;
  
  const queryClient = useQueryClient();
  const enableRealtimeGlobal = useSettingsStore(selectEnableRealtime);
  const enabled = options.enabled ?? enableRealtimeGlobal;
  
  const addRealtimeEntry = useMoodStore((state) => state.addRealtimeEntry);
  const setSyncing = useMoodStore((state) => state.setSyncing);
  const lastSyncAt = useMoodStore((state) => state.lastSyncAt);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Handle incoming real-time events
  const handleEvent = useCallback((event: RealtimeEvent) => {
    switch (event.type) {
      case 'mood:created': {
        const mood = event.payload as MoodEntry;
        // Add to store
        addRealtimeEntry(mood);
        // Invalidate queries to refresh
        queryClient.invalidateQueries({ queryKey: queryKeys.today() });
        queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
        // Callback
        onMoodReceived?.(mood);
        break;
      }
      case 'mood:updated':
      case 'mood:deleted':
        // Invalidate queries to trigger refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.today() });
        queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
        break;
      case 'sync:complete':
        setSyncing(false);
        setIsSyncing(false);
        break;
    }
  }, [queryClient, addRealtimeEntry, setSyncing, onMoodReceived]);

  // Connect to SSE
  const connect = useCallback(() => {
    if (!enabled || unsubscribeRef.current) return;
    
    try {
      unsubscribeRef.current = mockEventEmitter.subscribe(handleEvent);
      setIsConnected(true);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to connect'));
    }
  }, [enabled, handleEvent, onError]);

  // Disconnect from SSE
  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Manual sync trigger
  const sync = useCallback(async () => {
    setIsSyncing(true);
    setSyncing(true);
    
    try {
      await queryClient.invalidateQueries({ queryKey: queryKeys.all });
      // Simulate sync completion
      setTimeout(() => {
        mockEventEmitter.emit({
          type: 'sync:complete',
          payload: null,
          timestamp: Date.now(),
        });
      }, 500);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Sync failed'));
      setIsSyncing(false);
      setSyncing(false);
    }
  }, [queryClient, setSyncing, onError]);

  // Auto-connect when enabled
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    isSyncing,
    lastSyncAt,
    connect,
    disconnect,
    sync,
  };
}

// Hook for connection status indicator
export function useConnectionStatus() {
  const enableRealtime = useSettingsStore(selectEnableRealtime);
  const { isConnected, isSyncing } = useMoodSync({ enabled: enableRealtime });

  return {
    status: isSyncing 
      ? 'syncing' 
      : isConnected 
        ? 'connected' 
        : 'disconnected',
    color: isSyncing 
      ? '#fcd34d' 
      : isConnected 
        ? '#34d399' 
        : '#f87171',
  };
}

