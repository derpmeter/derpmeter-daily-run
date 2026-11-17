'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, LucideIcon } from 'lucide-react';

export type ActionButtonVariant = 'primary' | 'gradient' | 'ghost';
export type ActionButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<ActionButtonVariant, string> = {
  primary: 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20',
  gradient: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/20',
  ghost: 'bg-transparent hover:bg-white/10 text-gray-300 hover:text-white',
};

const sizeStyles: Record<ActionButtonSize, string> = {
  sm: 'h-8 px-4 text-xs rounded-full',
  md: 'h-10 px-6 text-sm rounded-full',
  lg: 'h-12 px-8 text-base rounded-xl',
  icon: 'w-10 h-10 rounded-full p-0',
};

/**
 * ActionButton - A standardized action button component for consistent styling
 * 
 * @example
 * // Primary solid purple button
 * <ActionButton icon={Plus}>Add Character</ActionButton>
 * 
 * // Gradient button with icon
 * <ActionButton variant="gradient" icon={Sparkles}>AI Recommend</ActionButton>
 * 
 * // Icon-only button
 * <ActionButton variant="primary" size="icon" icon={Plus} />
 * 
 * // Loading state
 * <ActionButton isLoading>Processing...</ActionButton>
 */
export default function ActionButton({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  children,
  className,
  disabled,
  ...props
}: ActionButtonProps) {
  const isIconOnly = size === 'icon' || (!children && Icon);

  return (
    <button
      className={cn(
        'font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        isIconOnly && 'gap-0',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 
            size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} 
            className="animate-spin" 
          />
          {!isIconOnly && children && <span>{children}</span>}
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
          )}
          {!isIconOnly && children && <span>{children}</span>}
          {Icon && iconPosition === 'right' && (
            <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
          )}
        </>
      )}
    </button>
  );
}
