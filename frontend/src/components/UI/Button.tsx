import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import SpecularButton from './SpecularButton';

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
      onClick,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDanger = variant === 'danger';
    const isSecondary = variant === 'secondary' || variant === 'ghost';

    // Tint / Highlight matching the green theme
    const tint = isDanger ? '#ef4444' : isSecondary ? '#f3f4f6' : '#168118';
    const lineColor = isDanger ? '#f87171' : isSecondary ? '#9ca3af' : '#10B981';
    const baseColor = isDanger ? '#dc2626' : isSecondary ? '#e5e7eb' : '#065f46';
    const textColor = isDanger ? '#ffffff' : isSecondary ? '#0f172a' : '#ffffff';

    return (
      <SpecularButton
        size={size}
        radius={14}
        tint={tint}
        tintOpacity={isSecondary ? 0.35 : 0.85}
        blur={isSecondary ? 8 : 0}
        textColor={textColor}
        lineColor={lineColor}
        baseColor={baseColor}
        intensity={isSecondary ? 0.6 : 1.2}
        shineSize={10}
        shineFade={35}
        thickness={1}
        speed={0.4}
        followMouse
        proximity={150}
        autoAnimate={loading}
        disabled={disabled || loading}
        className={className}
        onClick={onClick}
        type={type as any}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {!loading && icon && <span className="shrink-0">{icon}</span>}
        {children}
        {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
      </SpecularButton>
    );
  }
);

Button.displayName = 'Button';
export default Button;