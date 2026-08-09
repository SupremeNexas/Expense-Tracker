/**
 * GlassSurface — lightweight CSS-only liquid glass (no SVG filters).
 * Mirror/reflection removed. ResizeObserver removed.
 * Performance: zero extra paint/layout cost.
 */
import type { FC, ReactNode, CSSProperties } from 'react';

interface GlassSurfaceProps {
  children?: ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  backgroundOpacity?: number;
  saturation?: number;
  blur?: number;
  brightness?: number;
  opacity?: number;
  borderWidth?: number;
  displace?: number;
  className?: string;
  style?: CSSProperties;
}

const GlassSurface: FC<GlassSurfaceProps> = ({
  children,
  width = 'auto',
  height = 'auto',
  borderRadius = 20,
  backgroundOpacity = 0.65,
  saturation = 1.8,
  blur = 24,
  brightness = 1,
  opacity = 0.88,
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`glass-surface-v2 ${className}`}
      style={
        {
          ...style,
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          '--glass-bg': backgroundOpacity,
          '--glass-blur': `${blur}px`,
          '--glass-sat': saturation,
          '--glass-brightness': brightness,
          '--glass-alpha': opacity,
          borderRadius: `${borderRadius}px`,
        } as CSSProperties
      }
    >
      {/* Subtle inner highlight — no mirror/reflection */}
      <div className="glass-surface-v2__sheen" aria-hidden="true" />
      <div className="glass-surface-v2__content">{children}</div>
    </div>
  );
};

export default GlassSurface;