/**
 * MoodTimeline Component
 * 
 * A dynamic, animated timeline showing mood flow throughout the day.
 * Features gradient transitions, pulse animations, and real-time updates.
 */

import { useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { useTimeline, useTimelineGradient } from '@/hooks/useTimeline';
import { MOOD_COLORS, MOOD_EMOJIS, type MoodCategory } from '@/types';
import { format } from 'date-fns';

interface MoodTimelineProps {
  compact?: boolean;
  showLabels?: boolean;
  height?: number;
}

export function MoodTimeline({ 
  compact = false, 
  showLabels = true,
  height = 120 
}: MoodTimelineProps) {
  const { segments, currentMood, dominantMood, totalEntries, isLoading } = useTimeline();
  const gradient = useTimelineGradient(segments);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated gradient position for flow effect
  const flowPosition = useSpring(0, { stiffness: 20, damping: 30 });

  useEffect(() => {
    const interval = setInterval(() => {
      flowPosition.set(flowPosition.get() + 1);
    }, 100);
    return () => clearInterval(interval);
  }, [flowPosition]);

  // Draw animated particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || segments.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      life: number;
    }> = [];

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Add new particles
      if (Math.random() > 0.7 && particles.length < 30) {
        const segment = segments[Math.floor(Math.random() * segments.length)];
        particles.push({
          x: Math.random() * canvas.width,
          y: canvas.height / 2 + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.3,
          color: segment.color,
          size: Math.random() * 4 + 2,
          life: 1,
        });
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.008;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.floor(p.life * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
      }

      requestAnimationFrame(animate);
    };

    animate();
  }, [segments]);

  if (isLoading) {
    return (
      <div 
        className="rounded-[var(--radius-xl)] overflow-hidden animate-shimmer"
        style={{ height }}
      />
    );
  }

  if (segments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--color-border-default)] flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center p-6">
          <div className="text-4xl mb-2">🌅</div>
          <p className="text-[var(--color-text-secondary)] text-sm">
            No moods logged yet today
          </p>
          <p className="text-[var(--color-text-tertiary)] text-xs mt-1">
            Start your first check-in below
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-[var(--radius-xl)] overflow-hidden"
      style={{ height }}
    >
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 animate-flow"
        style={{ 
          background: gradient,
          backgroundSize: '400% 100%',
        }}
      />

      {/* Particle canvas overlay */}
      <canvas
        ref={canvasRef}
        width={800}
        height={height}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Glass overlay with content */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20">
        <div className="absolute inset-0 flex items-center justify-between px-6">
          {/* Current mood indicator */}
          {currentMood && (
            <motion.div
              key={currentMood.id}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="flex items-center gap-3"
            >
              <motion.div
                className="text-4xl"
                animate={{ 
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                {MOOD_EMOJIS[currentMood.category]}
              </motion.div>
              {showLabels && !compact && (
                <div className="text-white drop-shadow-lg">
                  <div className="text-sm font-medium capitalize">
                    {currentMood.category}
                  </div>
                  <div className="text-xs opacity-80">
                    {format(currentMood.timestamp, 'h:mm a')}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Stats */}
          {showLabels && !compact && (
            <div className="text-white text-right drop-shadow-lg">
              <div className="text-2xl font-bold">{totalEntries}</div>
              <div className="text-xs opacity-80">
                check-in{totalEntries !== 1 ? 's' : ''} today
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Time markers */}
      {showLabels && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 pb-2 text-[10px] text-white/60">
          <span>12am</span>
          <span>6am</span>
          <span>12pm</span>
          <span>6pm</span>
          <span>Now</span>
        </div>
      )}

      {/* Segment markers */}
      <div className="absolute bottom-4 left-0 right-0 px-4">
        <div className="relative h-1 bg-white/20 rounded-full overflow-hidden">
          {segments.map((segment, i) => {
            const now = Date.now();
            const dayStart = new Date().setHours(0, 0, 0, 0);
            const dayDuration = now - dayStart;
            const segmentStart = segment.startTime - dayStart;
            const segmentDuration = segment.endTime - segment.startTime;
            const left = Math.max(0, (segmentStart / dayDuration) * 100);
            const width = Math.min(100 - left, (segmentDuration / dayDuration) * 100);

            return (
              <motion.div
                key={segment.mood.id}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: i * 0.1 }}
                className="absolute h-full rounded-full"
                style={{
                  left: `${left}%`,
                  width: `${Math.max(width, 2)}%`,
                  backgroundColor: segment.color,
                  opacity: 0.6 + segment.intensity * 0.4,
                }}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// Mini timeline for compact views
export function MiniTimeline() {
  const { segments, dominantMood } = useTimeline();
  const gradient = useTimelineGradient(segments);

  return (
    <div className="flex items-center gap-2">
      <div 
        className="h-2 flex-1 rounded-full animate-flow"
        style={{ 
          background: segments.length > 0 ? gradient : 'var(--color-bg-tertiary)',
          backgroundSize: '400% 100%',
        }}
      />
      {dominantMood && (
        <span className="text-lg">{MOOD_EMOJIS[dominantMood]}</span>
      )}
    </div>
  );
}

// Mood distribution chart
export function MoodDistribution() {
  const { moodCounts, totalEntries } = useTimeline();
  const categories = Object.keys(MOOD_COLORS) as MoodCategory[];

  return (
    <div className="flex gap-1 h-16">
      {categories.map((category) => {
        const count = moodCounts[category] || 0;
        const percentage = totalEntries > 0 ? (count / totalEntries) * 100 : 0;

        return (
          <motion.div
            key={category}
            className="flex-1 flex flex-col items-center justify-end"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="w-full rounded-t-sm"
              style={{
                height: `${Math.max(percentage, 4)}%`,
                backgroundColor: MOOD_COLORS[category],
              }}
              whileHover={{ scale: 1.1 }}
            />
            <span className="text-xs mt-1" title={category}>
              {MOOD_EMOJIS[category]}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

