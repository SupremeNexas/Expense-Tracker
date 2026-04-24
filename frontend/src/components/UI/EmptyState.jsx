import React from 'react';
import * as Icons from 'lucide-react';

export const EmptyState = ({ iconName = 'inbox', title, description, action }) => {
  const Icon = Icons[iconName] || Icons.Inbox;

  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <Icon size={64} strokeWidth={1} />
      </div>
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__description">{description}</p>}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
};
