/**
 * SettingsPage Component
 * 
 * User preferences and app configuration.
 * Features theme switching, category customization, and real-time toggles.
 */

import { motion } from 'framer-motion';
import { useSettingsStore, selectQuickCategories } from '@/stores/settingsStore';
import { useTheme } from '@/hooks/useTheme';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/shared/components';
import { MOOD_EMOJIS, MOOD_COLORS, type MoodCategory, type Theme } from '@/types';

// Theme selector component
function ThemeSelector() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' },
  ];

  return (
    <Card variant="default" padding="md">
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Choose your preferred color scheme
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          {themes.map(({ value, label, icon }) => (
            <motion.button
              key={value}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTheme(value)}
              className={`
                flex-1 p-4 rounded-[var(--radius-lg)] border-2 transition-all
                ${theme === value
                  ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-glow)]'
                  : 'border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)]/50'
                }
              `}
            >
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-sm font-medium text-[var(--color-text-primary)]">
                {label}
              </div>
              {value === 'system' && (
                <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                  Currently: {resolvedTheme}
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Quick mood categories selector
function CategorySelector() {
  const quickCategories = useSettingsStore(selectQuickCategories);
  const addCategory = useSettingsStore((s) => s.addQuickMoodCategory);
  const removeCategory = useSettingsStore((s) => s.removeQuickMoodCategory);
  
  const allCategories = Object.keys(MOOD_EMOJIS) as MoodCategory[];

  const toggleCategory = (category: MoodCategory) => {
    if (quickCategories.includes(category)) {
      if (quickCategories.length > 2) {
        removeCategory(category);
      }
    } else {
      addCategory(category);
    }
  };

  return (
    <Card variant="default" padding="md">
      <CardHeader>
        <CardTitle>Quick Mood Categories</CardTitle>
        <CardDescription>
          Select which moods appear in your quick check-in (min 2)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {allCategories.map((category) => {
            const isSelected = quickCategories.includes(category);
            const isDisabled = isSelected && quickCategories.length <= 2;
            
            return (
              <motion.button
                key={category}
                whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                onClick={() => toggleCategory(category)}
                disabled={isDisabled}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full transition-all
                  ${isSelected
                    ? 'text-white shadow-md'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
                  }
                  ${isDisabled ? 'cursor-not-allowed opacity-70' : 'hover:scale-105'}
                `}
                style={{
                  backgroundColor: isSelected ? MOOD_COLORS[category] : undefined,
                }}
              >
                <span className="text-lg">{MOOD_EMOJIS[category]}</span>
                <span className="text-sm font-medium capitalize">{category}</span>
              </motion.button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Toggle settings
function ToggleSettings() {
  const enableRealtime = useSettingsStore((s) => s.enableRealtime);
  const enableNotifications = useSettingsStore((s) => s.enableNotifications);
  const toggleRealtime = useSettingsStore((s) => s.toggleRealtime);
  const toggleNotifications = useSettingsStore((s) => s.toggleNotifications);

  const toggles = [
    {
      id: 'realtime',
      label: 'Real-time Updates',
      description: 'Sync mood entries automatically in real-time',
      value: enableRealtime,
      onChange: toggleRealtime,
      icon: '⚡',
    },
    {
      id: 'notifications',
      label: 'Check-in Reminders',
      description: 'Get periodic reminders to log your mood',
      value: enableNotifications,
      onChange: toggleNotifications,
      icon: '🔔',
    },
  ];

  return (
    <Card variant="default" padding="md">
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {toggles.map(({ id, label, description, value, onChange, icon }) => (
            <div 
              key={id}
              className="flex items-center justify-between p-3 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <div className="font-medium text-[var(--color-text-primary)]">
                    {label}
                  </div>
                  <div className="text-sm text-[var(--color-text-tertiary)]">
                    {description}
                  </div>
                </div>
              </div>
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onChange}
                className={`
                  relative w-12 h-7 rounded-full transition-colors
                  ${value ? 'bg-[var(--color-accent-primary)]' : 'bg-[var(--color-bg-tertiary)]'}
                `}
              >
                <motion.div
                  className="absolute w-5 h-5 bg-white rounded-full top-1 shadow-md"
                  animate={{ left: value ? '26px' : '4px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Data management
function DataManagement() {
  const resetSettings = useSettingsStore((s) => s.resetSettings);

  const handleExport = () => {
    const data = {
      settings: useSettingsStore.getState(),
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `micromood-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card variant="default" padding="md">
      <CardHeader>
        <CardTitle>Data & Privacy</CardTitle>
        <CardDescription>
          Manage your mood data and settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Button
            variant="secondary"
            onClick={handleExport}
            className="w-full justify-start"
            leftIcon={<span>📥</span>}
          >
            Export My Data
          </Button>
          
          <Button
            variant="ghost"
            onClick={resetSettings}
            className="w-full justify-start text-[var(--color-text-tertiary)]"
            leftIcon={<span>🔄</span>}
          >
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// About section
function AboutSection() {
  return (
    <Card variant="glass" padding="md">
      <div className="text-center">
        <motion.div
          animate={{ 
            y: [0, -5, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className="text-4xl mb-3"
        >
          🧘
        </motion.div>
        <h3 className="font-semibold text-[var(--color-text-primary)]">
          MicroMood
        </h3>
        <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
          Version 1.0.0
        </p>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-4 max-w-xs mx-auto">
          Built with React, TypeScript, Zustand, React Query, and Framer Motion.
          Designed for mindful moments.
        </p>
      </div>
    </Card>
  );
}

export function SettingsPage() {
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
          Settings
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">
          Customize your MicroMood experience
        </p>
      </motion.div>

      {/* Theme */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ThemeSelector />
      </motion.div>

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <CategorySelector />
      </motion.div>

      {/* Toggles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ToggleSettings />
      </motion.div>

      {/* Data management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <DataManagement />
      </motion.div>

      {/* About */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <AboutSection />
      </motion.div>
    </motion.div>
  );
}

export default SettingsPage;

