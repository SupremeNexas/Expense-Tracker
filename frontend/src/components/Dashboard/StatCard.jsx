import * as Icons from 'lucide-react';
import './StatCard.css';

export const StatCard = ({ title, value, iconName, trend, loading }) => {
  const Icon = Icons[iconName] || Icons.Activity;

  if (loading) {
    return (
      <div className="stat-card glass-card skeleton">
        <div className="skeleton-icon"></div>
        <div className="skeleton-content">
          <div className="skeleton-title"></div>
          <div className="skeleton-value"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="stat-card glass-card">
      <div className="stat-card__icon-wrapper">
        <Icon size={24} className="stat-card__icon" />
      </div>
      <div className="stat-card__content">
        <h4 className="stat-card__title">{title}</h4>
        <div className="stat-card__value">{value}</div>
        {trend && (
          <div className={`stat-card__trend ${trend.positive ? 'positive' : 'negative'}`}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </div>
  );
};
