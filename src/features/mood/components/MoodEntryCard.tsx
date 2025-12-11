/**
 * MoodEntryCard Component
 * 
 * Displays a single mood entry with edit and delete capabilities.
 * Features optimistic updates and smooth animations.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { useUpdateMood, useDeleteMood } from '@/api/queries';
import { MOOD_EMOJIS, MOOD_COLORS, MOOD_LEVEL_LABELS, type MoodEntry, type MoodCategory, type MoodLevel } from '@/types';
import { Card } from '@/shared/components';

interface MoodEntryCardProps {
  entry: MoodEntry;
  index?: number;
}

export function MoodEntryCard({ entry, index = 0 }: MoodEntryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedLevel, setEditedLevel] = useState(entry.level);
  const [editedCategory, setEditedCategory] = useState(entry.category);
  
  const { mutate: updateMood, isPending: isUpdating } = useUpdateMood();
  const { mutate: deleteMood, isPending: isDeletePending } = useDeleteMood();

  const handleSave = useCallback(() => {
    updateMood(
      { id: entry.id, level: editedLevel, category: editedCategory },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  }, [entry.id, editedLevel, editedCategory, updateMood]);

  const handleDelete = useCallback(() => {
    deleteMood(entry.id, {
      onSuccess: () => setIsDeleting(false),
    });
  }, [entry.id, deleteMood]);

  const isPending = entry.id.startsWith('temp-');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isPending ? 0.7 : 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card 
        variant="default"
        padding="none"
        className={`overflow-hidden ${isPending ? 'animate-pulse' : ''}`}
      >
        {/* Main content */}
        <div className="flex items-center p-4">
          {/* Mood emoji */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mr-4"
            style={{ backgroundColor: `${MOOD_COLORS[entry.category]}30` }}
          >
            {MOOD_EMOJIS[entry.category]}
          </motion.div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--color-text-primary)] capitalize">
                {entry.category}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
                {MOOD_LEVEL_LABELS[entry.level]}
              </span>
              {isPending && (
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  Saving...
                </span>
              )}
            </div>
            <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
              {format(entry.timestamp, 'h:mm a')} · {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
            </div>
            {entry.note && (
              <p className="text-sm text-[var(--color-text-secondary)] mt-2 truncate">
                {entry.note}
              </p>
            )}
          </div>

          {/* Actions */}
          {!isPending && (
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 rounded-full hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                <EditIcon />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsDeleting(true)}
                className="p-2 rounded-full hover:bg-red-500/10 text-[var(--color-text-tertiary)] hover:text-red-500"
              >
                <TrashIcon />
              </motion.button>
            </div>
          )}
        </div>

        {/* Edit panel */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-[var(--color-border-default)]"
            >
              <div className="p-4 bg-[var(--color-bg-secondary)] space-y-4">
                {/* Category selector */}
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(MOOD_EMOJIS) as MoodCategory[]).map((cat) => (
                    <motion.button
                      key={cat}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEditedCategory(cat)}
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${editedCategory === cat ? 'ring-2 ring-[var(--color-accent-primary)]' : ''}
                      `}
                      style={{ backgroundColor: `${MOOD_COLORS[cat]}30` }}
                    >
                      {MOOD_EMOJIS[cat]}
                    </motion.button>
                  ))}
                </div>

                {/* Level selector */}
                <div className="flex gap-2">
                  {([1, 2, 3, 4, 5] as MoodLevel[]).map((level) => (
                    <motion.button
                      key={level}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEditedLevel(level)}
                      className={`
                        flex-1 py-2 rounded-[var(--radius-md)] text-sm font-medium
                        ${editedLevel === level
                          ? 'bg-[var(--color-accent-primary)] text-white'
                          : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
                        }
                      `}
                    >
                      {level}
                    </motion.button>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="flex-1 btn btn-primary"
                  >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete confirmation */}
        <AnimatePresence>
          {isDeleting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[var(--color-bg-primary)]/95 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div className="text-center">
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  Delete this mood entry?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsDeleting(false)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeletePending}
                    className="btn bg-red-500 text-white hover:bg-red-600"
                  >
                    {isDeletePending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Color indicator bar */}
        <div 
          className="h-1"
          style={{ backgroundColor: MOOD_COLORS[entry.category] }}
        />
      </Card>
    </motion.div>
  );
}

// Icons
function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

// List component for mood entries
interface MoodEntryListProps {
  entries: MoodEntry[];
  emptyMessage?: string;
}

export function MoodEntryList({ entries, emptyMessage = 'No mood entries yet' }: MoodEntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">📝</div>
        <p className="text-[var(--color-text-secondary)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {entries.map((entry, index) => (
          <MoodEntryCard key={entry.id} entry={entry} index={index} />
        ))}
      </AnimatePresence>
    </div>
  );
}

