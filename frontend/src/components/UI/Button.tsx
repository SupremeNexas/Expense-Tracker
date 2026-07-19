import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      icon,
      iconRight,
      ...props
    },
    ref
  ) => {
    // Base styles from design system
    let baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500/20 rounded-[14px] cursor-pointer';

    // Size variants
    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded-[10px] gap-1.5 h-8',
      md: 'px-4 py-2 text-sm rounded-[14px] gap-2 h-10',
      lg: 'px-6 py-3 text-base rounded-[16px] gap-2.5 h-12',
    };

    // Color/Visual variants
    const variants = {
      primary: 'bg-text text-bg hover:opacity-90 dark:bg-text dark:text-bg shadow-sm border border-transparent',
      secondary: 'bg-transparent text-text border border-border hover:bg-black/[0.03] dark:hover:bg-white/[0.03]',
      danger: 'bg-red text-white hover:bg-red/90 shadow-sm border border-transparent',
      ghost: 'bg-transparent text-text hover:bg-black/[0.02] dark:hover:bg-white/[0.02] border border-transparent',
    };

    const combinedClassName = `${baseStyles} ${sizes[size]} ${variants[variant]} ${
      disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
    } ${className}`;

    return (
      <motion.button
        ref={ref}
        whileTap={disabled || loading ? undefined : { scale: 0.98 }}
        className={combinedClassName}
        disabled={disabled || loading}
        {...(props as any)}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {!loading && icon && <span className="shrink-0">{icon}</span>}
        {children}
        {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
