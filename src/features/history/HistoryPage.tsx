/**
 * HistoryPage Component
 * 
 * Displays mood history with filtering and date navigation.
 * Features optimistic updates and server-rendered data.
 */

import { useState, useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useMoodsSuspense } from '@/api/queries';
import { MoodEntryList } from '@/features/mood/components';
import { Card, MoodEntrySkeleton } from '@/shared/components';
import { MOOD_COLORS, MOOD_EMOJIS, type MoodCategory, type MoodFilter } from '@/types';

type DateRange = 'today' | 'week' | 'month' | 'all' | 'custom';

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
];

function getDateRangeFilter(range: DateRange): { startDate?: number; endDate?: number } {
  const now = new Date();
  
  switch (range) {
    case 'today':
      return {
        startDate: startOfDay(now).getTime(),
        endDate: endOfDay(now).getTime(),
      };
    case 'week':
      return {
        startDate: startOfWeek(now).getTime(),
        endDate: endOfWeek(now).getTime(),
      };
    case 'month':
      return {
        startDate: startOfMonth(now).getTime(),
        endDate: endOfMonth(now).getTime(),
      };
    case 'all':
    default:
      return {};
  }
}

// Filter panel component
interface FilterPanelProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  selectedCategories: MoodCategory[];
  onCategoriesChange: (categories: MoodCategory[]) => void;
}

function FilterPanel({
  dateRange,
  onDateRangeChange,
  selectedCategories,
  onCategoriesChange,
}: FilterPanelProps) {
  const toggleCategory = (category: MoodCategory) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  return (
    <Card variant="default" padding="md">
      <div className="space-y-4">
        {/* Date range filter */}
        <div>
          <label className="text-sm font-medium text-[var(--color-text-primary)] mb-2 block">
            Time Period
          </label>
          <div className="flex flex-wrap gap-2">
            {DATE_RANGES.map(({ value, label }) => (
              <motion.button
                key={value}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDateRangeChange(value)}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium transition-all
                  ${dateRange === value
                    ? 'bg-[var(--color-accent-primary)] text-white'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-default)]'
                  }
                `}
              >
                {label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div>
          <label className="text-sm font-medium text-[var(--color-text-primary)] mb-2 block">
            Mood Categories
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MOOD_EMOJIS) as MoodCategory[]).map((category) => (
              <motion.button
                key={category}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleCategory(category)}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-lg
                  transition-all
                  ${selectedCategories.includes(category) || selectedCategories.length === 0
                    ? 'ring-2 ring-offset-2'
                    : 'opacity-40 hover:opacity-70'
                  }
                `}
                style={{
                  backgroundColor: `${MOOD_COLORS[category]}30`,
                }}
              >
                {MOOD_EMOJIS[category]}
              </motion.button>
            ))}
          </div>
          {selectedCategories.length > 0 && (
            <button
              onClick={() => onCategoriesChange([])}
              className="text-xs text-[var(--color-accent-primary)] mt-2 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Mood list with Suspense
function MoodList({ filter }: { filter: MoodFilter }) {
  const { data } = useMoodsSuspense(filter);
  const entries = data?.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Mood Entries
        </h2>
        <span className="text-sm text-[var(--color-text-tertiary)]">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <MoodEntryList 
        entries={entries}
        emptyMessage="No mood entries found for this period"
      />
    </div>
  );
}

// Stats summary
function StatsSummary({ filter }: { filter: MoodFilter }) {
  const { data } = useMoodsSuspense(filter);
  const entries = data?.data ?? [];

  const stats = useMemo(() => {
    if (entries.length === 0) return null;

    const totalLevel = entries.reduce((sum, e) => sum + e.level, 0);
    const avgLevel = totalLevel / entries.length;
    
    const categoryCounts: Record<string, number> = {};
    entries.forEach(e => {
      categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
    });
    
    const dominantCategory = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] as MoodCategory | undefined;

    return {
      avgLevel: avgLevel.toFixed(1),
      count: entries.length,
      dominantCategory,
    };
  }, [entries]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card variant="default" padding="md" className="text-center">
        <div className="text-2xl font-bold text-[var(--color-accent-primary)]">
          {stats.count}
        </div>
        <div className="text-xs text-[var(--color-text-tertiary)]">
          Total Check-ins
        </div>
      </Card>
      
      <Card variant="default" padding="md" className="text-center">
        <div className="text-2xl font-bold text-[var(--color-accent-primary)]">
          {stats.avgLevel}
        </div>
        <div className="text-xs text-[var(--color-text-tertiary)]">
          Avg. Level
        </div>
      </Card>
      
      <Card variant="default" padding="md" className="text-center">
        {stats.dominantCategory ? (
          <>
            <div className="text-2xl">{MOOD_EMOJIS[stats.dominantCategory]}</div>
            <div className="text-xs text-[var(--color-text-tertiary)] capitalize">
              {stats.dominantCategory}
            </div>
          </>
        ) : (
          <div className="text-[var(--color-text-tertiary)]">—</div>
        )}
      </Card>
    </div>
  );
}

export function HistoryPage() {
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [selectedCategories, setSelectedCategories] = useState<MoodCategory[]>([]);

  const filter: MoodFilter = useMemo(() => {
    const dateFilter = getDateRangeFilter(dateRange);
    return {
      ...dateFilter,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    };
  }, [dateRange, selectedCategories]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto px-4 py-8 space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Mood History
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">
          Review and reflect on your mood patterns
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <FilterPanel
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
        />
      </motion.div>

      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Suspense fallback={
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-lg" />
            ))}
          </div>
        }>
          <StatsSummary filter={filter} />
        </Suspense>
      </motion.div>

      {/* Entry List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Suspense fallback={
          <Card variant="default" padding="md">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <MoodEntrySkeleton key={i} />
              ))}
            </div>
          </Card>
        }>
          <MoodList filter={filter} />
        </Suspense>
      </motion.div>
    </motion.div>
  );
}

export default HistoryPage;

