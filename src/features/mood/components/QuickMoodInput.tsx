/**
 * QuickMoodInput Component
 * 
 * A fast, emoji-based mood input for 5-second check-ins.
 * Features optimistic updates and haptic-like feedback.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateMood } from '@/api/queries';
import { useSettingsStore, selectQuickCategories } from '@/stores/settingsStore';
import { MOOD_EMOJIS, MOOD_COLORS, MOOD_LEVEL_LABELS, type MoodCategory, type MoodLevel } from '@/types';

interface QuickMoodInputProps {
  onMoodLogged?: () => void;
  showLevel?: boolean;
}

export function QuickMoodInput({ onMoodLogged, showLevel = true }: QuickMoodInputProps) {
  const [selectedCategory, setSelectedCategory] = useState<MoodCategory | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<MoodLevel>(3);
  const [isExpanded, setIsExpanded] = useState(false);
  const [justLogged, setJustLogged] = useState(false);
  
  const quickCategories = useSettingsStore(selectQuickCategories);
  const { mutate: createMood, isPending } = useCreateMood();

  const handleCategorySelect = useCallback((category: MoodCategory) => {
    setSelectedCategory(category);
    setIsExpanded(true);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedCategory) return;

    createMood(
      { category: selectedCategory, level: selectedLevel },
      {
        onSuccess: () => {
          setJustLogged(true);
          setSelectedCategory(null);
          setIsExpanded(false);
          setSelectedLevel(3);
          onMoodLogged?.();
          
          // Reset the "just logged" state after animation
          setTimeout(() => setJustLogged(false), 2000);
        },
      }
    );
  }, [selectedCategory, selectedLevel, createMood, onMoodLogged]);

  return (
    <div className="space-y-4">
      {/* Success feedback */}
      <AnimatePresence>
        {justLogged && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-[var(--color-mood-happy)]/20 border border-[var(--color-mood-happy)]/30 rounded-[var(--radius-lg)] p-4 text-center"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
              className="text-2xl mb-1"
            >
              ✨
            </motion.div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Mood logged!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category selection */}
      <div className="flex flex-wrap justify-center gap-2">
        {quickCategories.map((category, index) => (
          <motion.button
            key={category}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.15, y: -4 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleCategorySelect(category)}
            className={`
              relative w-14 h-14 rounded-full flex items-center justify-center
              text-2xl transition-all duration-200
              ${selectedCategory === category 
                ? 'ring-2 ring-offset-2 ring-[var(--color-accent-primary)] shadow-lg' 
                : 'hover:shadow-md'
              }
            `}
            style={{
              backgroundColor: selectedCategory === category 
                ? MOOD_COLORS[category] 
                : `${MOOD_COLORS[category]}30`,
            }}
          >
            <span className="drop-shadow-sm">{MOOD_EMOJIS[category]}</span>
            
            {/* Selection ring animation */}
            {selectedCategory === category && (
              <motion.div
                layoutId="selected-ring"
                className="absolute inset-0 rounded-full border-2 border-white/50"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Expanded input area */}
      <AnimatePresence>
        {isExpanded && selectedCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[var(--color-bg-secondary)] rounded-[var(--radius-lg)] p-4 space-y-4">
              {/* Level selector */}
              {showLevel && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      Intensity
                    </span>
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {MOOD_LEVEL_LABELS[selectedLevel]}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    {([1, 2, 3, 4, 5] as MoodLevel[]).map((level) => (
                      <motion.button
                        key={level}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedLevel(level)}
                        className={`
                          flex-1 h-10 rounded-[var(--radius-md)] text-sm font-medium
                          transition-all duration-200
                          ${selectedLevel === level
                            ? 'text-white shadow-md'
                            : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
                          }
                        `}
                        style={{
                          backgroundColor: selectedLevel === level 
                            ? MOOD_COLORS[selectedCategory]
                            : undefined,
                        }}
                      >
                        {level}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsExpanded(false);
                    setSelectedCategory(null);
                  }}
                  className="flex-1 btn btn-ghost"
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="flex-1 btn btn-primary"
                >
                  {isPending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      Log Mood {MOOD_EMOJIS[selectedCategory]}
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper text */}
      {!isExpanded && (
        <p className="text-center text-xs text-[var(--color-text-tertiary)]">
          Tap an emoji for a quick 5-second check-in
        </p>
      )}
    </div>
  );
}

// Floating action button variant
export function FloatingMoodButton() {
  const [isOpen, setIsOpen] = useState(false);
  const quickCategories = useSettingsStore(selectQuickCategories);
  const { mutate: createMood } = useCreateMood();

  const handleQuickLog = (category: MoodCategory) => {
    createMood({ category, level: 3 });
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute bottom-16 right-0 flex flex-col gap-2"
          >
            {quickCategories.slice(0, 4).map((category, i) => (
              <motion.button
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleQuickLog(category)}
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg"
                style={{ backgroundColor: MOOD_COLORS[category] }}
              >
                {MOOD_EMOJIS[category]}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full btn btn-primary shadow-lg"
      >
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          className="text-2xl"
        >
          +
        </motion.span>
      </motion.button>
    </div>
  );
}

