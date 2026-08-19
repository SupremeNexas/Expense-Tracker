import React from 'react';
import './SpecularButton.css';

interface SpecularButtonProps {
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  radius?: number;
  textColor?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  // Keep original properties signature for compatibility
  baseColor?: string;
  lineColor?: string;
  tint?: string;
  tintOpacity?: number;
  blur?: number;
  intensity?: number;
  shineSize?: number;
  shineFade?: number;
  thickness?: number;
  speed?: number;
  followMouse?: boolean;
  proximity?: number;
  autoAnimate?: boolean;
}

export const SpecularButton = ({
  children = 'Get Started',
  size = 'lg',
  radius = 18,
  disabled = false,
  onClick,
  className = '',
  type = 'button'
}: SpecularButtonProps) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`specular-button-flat size-${size}${className ? ` ${className}` : ''}`}
      style={{
        borderRadius: `${radius}px`
      }}
    >
      <span className="specular-button__label">{children}</span>
    </button>
  );
};

export default SpecularButton;
