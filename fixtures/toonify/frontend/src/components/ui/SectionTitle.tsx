'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type SectionTitleColor = 'purple' | 'indigo' | 'blue' | 'green' | 'amber' | 'rose';

interface SectionTitleProps {
  children: React.ReactNode;
  color?: SectionTitleColor;
  className?: string;
  action?: React.ReactNode;
}

const colorStyles: Record<SectionTitleColor, string> = {
  purple: 'bg-purple-600 shadow-[0_0_12px_rgba(147,51,234,0.6)]',
  indigo: 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]',
  blue: 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]',
  green: 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]',
  amber: 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]',
  rose: 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]',
};

/**
 * SectionTitle - A reusable section header component with a colored accent bar
 * 
 * @example
 * // Basic usage
 * <SectionTitle>Recent Projects</SectionTitle>
 * 
 * // With custom color
 * <SectionTitle color="indigo">Start New</SectionTitle>
 * 
 * // With action button
 * <SectionTitle action={<button>View All</button>}>Recent Projects</SectionTitle>
 */
export default function SectionTitle({
  children,
  color = 'purple',
  className,
  action,
}: SectionTitleProps) {
  return (
    <div className={cn('flex items-center justify-between mb-6', className)}>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-1.5 h-6 rounded-full',
            colorStyles[color]
          )}
        />
        <h2 className="text-xl font-bold text-white tracking-wide">{children}</h2>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
