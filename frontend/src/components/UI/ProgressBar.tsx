import React from 'react';

interface ProgressBarProps {
  value: number; // Percentage value (0 - 100)
  height?: string;
  className?: string;
  showLabel?: boolean;
  label?: string;
  showPercent?: boolean;
  isOverLimit?: boolean;
}

export function ProgressBar({
  value,
  height = '6px',
  className = '',
  showLabel = false,
  label = '',
  showPercent = false,
  isOverLimit = false,
}: ProgressBarProps) {
  const percent = Math.min(Math.max(value, 0), 100);

  // Determine progress color
  let barColor = 'bg-emerald-500';
  if (isOverLimit || percent >= 100) {
    barColor = 'bg-red';
  } else if (percent >= 80) {
    barColor = 'bg-yellow-500';
  }

  return (
    <div className={`w-full text-left font-sans ${className}`}>
      {(showLabel || showPercent) && (
        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1.5 tracking-wider">
          {showLabel && <span>{label}</span>}
          {showPercent && <span>{percent.toFixed(0)}%</span>}
        </div>
      )}
      <div 
        className="w-full bg-black/[0.04] dark:bg-white/[0.04] rounded-full overflow-hidden" 
        style={{ height }}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
