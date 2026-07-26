import { type CSSProperties, type PointerEvent, type ReactNode, useCallback, useEffect, useRef } from 'react';
import './BorderGlow.css';

interface GlowHslColor {
  h: number;
  s: number;
  l: number;
}

interface AnimateValueOptions {
  start?: number;
  end?: number;
  duration?: number;
  delay?: number;
  ease?: (value: number) => number;
  onUpdate: (value: number) => void;
  onEnd?: () => void;
}

interface BorderGlowProps {
  children: ReactNode;
  className?: string;
  edgeSensitivity?: number;
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  animated?: boolean;
  colors?: string[];
  fillOpacity?: number;
  alwaysVisible?: boolean;
}

type BorderGlowStyle = CSSProperties & Record<`--${string}`, string | number>;

const DEFAULT_HSL_COLOR: GlowHslColor = { h: 40, s: 80, l: 80 };
const DEFAULT_COLORS = ['#c084fc', '#f472b6', '#38bdf8'];
const GLOW_OPACITIES = [100, 60, 50, 40, 30, 20, 10];
const GLOW_KEYS = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
const GRADIENT_KEYS = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven'];
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

function parseHsl(hslStr: string): GlowHslColor {
  const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);

  if (!match) {
    return DEFAULT_HSL_COLOR;
  }

  return {
    h: Number.parseFloat(match[1]),
    s: Number.parseFloat(match[2]),
    l: Number.parseFloat(match[3]),
  };
}

function buildGlowVars(glowColor: string, intensity: number): BorderGlowStyle {
  const { h, s, l } = parseHsl(glowColor);
  const base = `${h}deg ${s}% ${l}%`;

  return GLOW_OPACITIES.reduce<BorderGlowStyle>((vars, opacity, index) => ({
    ...vars,
    [`--glow-color${GLOW_KEYS[index]}`]: `hsl(${base} / ${Math.min(opacity * intensity, 100)}%)`,
  }), {});
}

function buildGradientVars(colors: string[]): BorderGlowStyle {
  const safeColors = colors.length > 0 ? colors : DEFAULT_COLORS;
  const gradientVars = GRADIENT_KEYS.reduce<BorderGlowStyle>((vars, key, index) => {
    const colorIndex = Math.min(COLOR_MAP[index], safeColors.length - 1);

    return {
      ...vars,
      [key]: `radial-gradient(at ${GRADIENT_POSITIONS[index]}, ${safeColors[colorIndex]} 0px, transparent 50%)`,
    };
  }, {});

  return {
    ...gradientVars,
    '--gradient-base': `linear-gradient(${safeColors[0]} 0 100%)`,
  };
}

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}

function easeInCubic(value: number): number {
  return value * value * value;
}

function animateValue({
  start = 0,
  end = 100,
  duration = 1000,
  delay = 0,
  ease = easeOutCubic,
  onUpdate,
  onEnd,
}: AnimateValueOptions): number {
  const startTime = performance.now() + delay;

  const tick = () => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    onUpdate(start + (end - start) * ease(progress));

    if (progress < 1) {
      requestAnimationFrame(tick);
      return;
    }

    onEnd?.();
  };

  return window.setTimeout(() => requestAnimationFrame(tick), delay);
}

export default function BorderGlow({
  children,
  className = '',
  edgeSensitivity = 30,
  glowColor = '40 80 80',
  backgroundColor = '#120F17',
  borderRadius = 28,
  glowRadius = 40,
  glowIntensity = 1,
  coneSpread = 25,
  animated = false,
  colors = DEFAULT_COLORS,
  fillOpacity = 0.5,
  alwaysVisible = false,
}: BorderGlowProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const getCenterOfElement = useCallback((el: HTMLDivElement): [number, number] => {
    const { width, height } = el.getBoundingClientRect();

    return [width / 2, height / 2];
  }, []);

  const getEdgeProximity = useCallback((el: HTMLDivElement, x: number, y: number): number => {
    const [cx, cy] = getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;
    const kx = dx === 0 ? Infinity : cx / Math.abs(dx);
    const ky = dy === 0 ? Infinity : cy / Math.abs(dy);

    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  }, [getCenterOfElement]);

  const getCursorAngle = useCallback((el: HTMLDivElement, x: number, y: number): number => {
    const [cx, cy] = getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;

    if (dx === 0 && dy === 0) {
      return 0;
    }

    const radians = Math.atan2(dy, dx);
    const degrees = radians * (180 / Math.PI) + 90;

    return degrees < 0 ? degrees + 360 : degrees;
  }, [getCenterOfElement]);

  const handlePointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;

    if (!card) {
      return;
    }

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const edge = getEdgeProximity(card, x, y);
    const angle = getCursorAngle(card, x, y);

    card.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(3)}`);
    card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
  }, [getEdgeProximity, getCursorAngle]);

  useEffect(() => {
    if (!animated || !cardRef.current) {
      return undefined;
    }

    const card = cardRef.current;
    const angleStart = 110;
    const angleEnd = 465;
    const timeouts = [
      animateValue({ duration: 500, onUpdate: value => card.style.setProperty('--edge-proximity', `${value}`) }),
      animateValue({
        ease: easeInCubic,
        duration: 1500,
        end: 50,
        onUpdate: value => card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (value / 100) + angleStart}deg`),
      }),
      animateValue({
        ease: easeOutCubic,
        delay: 1500,
        duration: 2250,
        start: 50,
        end: 100,
        onUpdate: value => card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (value / 100) + angleStart}deg`),
      }),
      animateValue({
        ease: easeInCubic,
        delay: 2500,
        duration: 1500,
        start: 100,
        end: alwaysVisible ? 70 : 0,
        onUpdate: value => card.style.setProperty('--edge-proximity', `${value}`),
        onEnd: () => card.classList.remove('sweep-active'),
      }),
    ];

    card.classList.add('sweep-active');
    card.style.setProperty('--cursor-angle', `${angleStart}deg`);

    return () => {
      timeouts.forEach(timeout => window.clearTimeout(timeout));
      card.classList.remove('sweep-active');
    };
  }, [alwaysVisible, animated]);

  const classes = ['border-glow-card', alwaysVisible ? 'border-glow-card-visible' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      className={classes}
      style={{
        // @ts-ignore
        '--card-bg': backgroundColor,
        '--edge-sensitivity': edgeSensitivity,
        '--border-radius': `${borderRadius}px`,
        '--glow-padding': `${glowRadius}px`,
        '--cone-spread': coneSpread,
        '--fill-opacity': fillOpacity,
        ...buildGlowVars(glowColor, glowIntensity),
        ...buildGradientVars(colors),
      }}
    >
      <span className="edge-light" />
      <div className="border-glow-inner">{children}</div>
    </div>
  );
}
