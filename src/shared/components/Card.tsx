/**
 * Card Component
 * 
 * Reusable card container with various styles.
 */

import { type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'glass' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  children: ReactNode;
}

const variantStyles = {
  default: `
    bg-[var(--color-bg-elevated)]
    border border-[var(--color-border-default)]
  `,
  elevated: `
    bg-[var(--color-bg-elevated)]
    shadow-lg
  `,
  glass: `
    glass
  `,
  outline: `
    bg-transparent
    border-2 border-[var(--color-border-default)]
  `,
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
};

export function Card({
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <motion.div
      className={`
        rounded-[var(--radius-lg)]
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${hover ? 'transition-transform hover:-translate-y-1 hover:shadow-lg cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Card header component
export function CardHeader({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

// Card title component
export function CardTitle({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <h3 className={`text-lg font-semibold text-[var(--color-text-primary)] ${className}`}>
      {children}
    </h3>
  );
}

// Card description component
export function CardDescription({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <p className={`text-sm text-[var(--color-text-secondary)] mt-1 ${className}`}>
      {children}
    </p>
  );
}

// Card content component
export function CardContent({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

// Card footer component
export function CardFooter({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div className={`mt-4 pt-4 border-t border-[var(--color-border-default)] ${className}`}>
      {children}
    </div>
  );
}

