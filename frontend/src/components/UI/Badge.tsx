import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  style,
}: BadgeProps) {
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-full tracking-wider uppercase font-sans select-none';

  // Size configurations
  const sizes = {
    sm: 'px-2 py-0.5 text-[9px]',
    md: 'px-2.5 py-1 text-[10px]',
  };

  // Color configurations using opacity background
  const variants = {
    neutral: 'bg-black/[0.04] text-text dark:bg-white/[0.04]',
    default: 'bg-accent/10 text-accent',
    success: 'bg-green/10 text-green',
    warning: 'bg-yellow-500/10 text-yellow-500',
    error: 'bg-red/10 text-red',
    info: 'bg-blue-500/10 text-blue-500',
  };

  return (
    <span
      className={`${baseClasses} ${sizes[size]} ${variants[variant]} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}

export default Badge;
