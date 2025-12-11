/**
 * HomePage Component
 * 
 * The main dashboard showing live mood timeline and quick input.
 * Features real-time updates and animated transitions.
 */

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { MoodTimeline, QuickMoodInput, MoodEntryList, MoodDistribution } from '@/features/mood/components';
import { useTodayMoodsSuspense } from '@/api/queries';
import { useMoodSync, useConnectionStatus } from '@/hooks/useMoodSync';
import { Card, CardHeader, CardTitle, TimelineSkeleton, MoodEntrySkeleton } from '@/shared/components';

// Animated header component
function AnimatedHeader() {
  const { status, color } = useConnectionStatus();
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-8"
    >
      <motion.h1 
        className="text-3xl font-bold text-[var(--color-text-primary)] mb-2"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
      >
        <span className="text-gradient">MicroMood</span>
      </motion.h1>
      <p className="text-[var(--color-text-secondary)] text-sm">
        5-second check-ins for mindful moments
      </p>
      
      {/* Connection status indicator */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ 
            scale: status === 'syncing' ? [1, 1.2, 1] : 1,
            opacity: status === 'syncing' ? [1, 0.5, 1] : 1,
          }}
          transition={{ 
            duration: 1, 
            repeat: status === 'syncing' ? Infinity : 0 
          }}
        />
        <span className="text-xs text-[var(--color-text-tertiary)] capitalize">
          {status}
        </span>
      </div>
    </motion.div>
  );
}

// Today's entries section with Suspense
function TodayEntries() {
  const { data } = useTodayMoodsSuspense();
  const entries = data?.data ?? [];

  return (
    <Card variant="default" padding="md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Today's Check-ins</CardTitle>
          <span className="text-sm text-[var(--color-text-tertiary)]">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
      </CardHeader>
      
      <MoodEntryList 
        entries={entries.slice(0, 5)} 
        emptyMessage="Start your first check-in above!"
      />
      
      {entries.length > 5 && (
        <motion.a
          href="/history"
          whileHover={{ x: 4 }}
          className="block text-center text-sm text-[var(--color-accent-primary)] mt-4 hover:underline"
        >
          View all {entries.length} entries →
        </motion.a>
      )}
    </Card>
  );
}

// Distribution chart section
function MoodInsights() {
  const { data } = useTodayMoodsSuspense();
  const entries = data?.data ?? [];

  if (entries.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <Card variant="default" padding="md">
        <CardHeader>
          <CardTitle>Mood Distribution</CardTitle>
        </CardHeader>
        <MoodDistribution />
      </Card>
    </motion.div>
  );
}

export function HomePage() {
  // Initialize real-time sync
  useMoodSync();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto px-4 py-8 space-y-6"
    >
      <AnimatedHeader />

      {/* Mood Timeline */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Suspense fallback={<TimelineSkeleton />}>
          <MoodTimeline height={140} />
        </Suspense>
      </motion.section>

      {/* Quick Mood Input */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>How are you feeling?</CardTitle>
          </CardHeader>
          <QuickMoodInput showLevel={true} />
        </Card>
      </motion.section>

      {/* Today's entries */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Suspense fallback={
          <Card variant="default" padding="md">
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <MoodEntrySkeleton key={i} />
              ))}
            </div>
          </Card>
        }>
          <TodayEntries />
        </Suspense>
      </motion.section>

      {/* Insights */}
      <Suspense fallback={null}>
        <MoodInsights />
      </Suspense>
    </motion.div>
  );
}

export default HomePage;

