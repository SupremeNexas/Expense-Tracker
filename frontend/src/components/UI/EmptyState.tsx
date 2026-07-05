import React from 'react';
import * as Icons from 'lucide-react';

interface EmptyStateProps {
  iconName?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ iconName = 'Inbox', title, description, action }: EmptyStateProps) {
  // @ts-ignore
  const Icon = Icons[iconName] || Icons.Inbox;

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-black/[0.08] dark:border-white/[0.08] rounded-[22px]">
      <div className="text-gray-400 mb-3">
        <Icon size={48} strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && <p className="text-xs text-gray-400 mt-1 max-w-[280px]">{description}</p>}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}
export default EmptyState;
