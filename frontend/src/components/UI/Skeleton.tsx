import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  circle?: boolean;
}

export function Skeleton({ className = '', width, height, circle = false }: SkeletonProps) {
  const styles: React.CSSProperties = {};
  if (width) styles.width = width;
  if (height) styles.height = height;

  return (
    <div
      className={`shimmer rounded-[6px] ${circle ? 'rounded-full' : ''} ${className}`}
      style={styles}
    />
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`premium-card p-6 flex flex-col justify-between h-36 ${className}`}>
      <div className="space-y-2">
        <Skeleton width="40%" height="12px" className="rounded" />
        <Skeleton width="60%" height="28px" className="rounded-md mt-1" />
      </div>
      <Skeleton width="30%" height="10px" className="rounded mt-2" />
    </div>
  );
}

export function SkeletonList({ count = 3, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="premium-card p-4 flex items-center justify-between border-black/[0.04] dark:border-white/[0.04] h-20">
          <div className="flex items-center gap-4 w-full">
            <Skeleton width="40px" height="40px" className="rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton width="35%" height="14px" className="rounded" />
              <Skeleton width="20%" height="10px" className="rounded" />
            </div>
            <Skeleton width="60px" height="18px" className="rounded-lg shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ className = '' }: { className?: string }) {
  return (
    <div className={`premium-card p-6 flex flex-col justify-between min-h-[300px] ${className}`}>
      <div className="space-y-1">
        <Skeleton width="25%" height="16px" className="rounded" />
        <Skeleton width="45%" height="10px" className="rounded" />
      </div>
      <div className="flex items-end gap-3 h-48 mt-6">
        <Skeleton width="100%" height="20%" className="rounded-t-lg" />
        <Skeleton width="100%" height="50%" className="rounded-t-lg" />
        <Skeleton width="100%" height="30%" className="rounded-t-lg" />
        <Skeleton width="100%" height="80%" className="rounded-t-lg" />
        <Skeleton width="100%" height="45%" className="rounded-t-lg" />
        <Skeleton width="100%" height="60%" className="rounded-t-lg" />
      </div>
    </div>
  );
}

export default Skeleton;
