import './BudgetProgress.css';

export const BudgetProgress = ({ spent, total, color }) => {
  const percentage = total > 0 ? (spent / total) * 100 : 0;
  const isOver = percentage > 100;
  const isWarning = percentage >= 80 && !isOver;
  
  // Cap at 100% for the fill bar
  const fillPercentage = Math.min(percentage, 100);
  
  let barColor = color || 'var(--accent-teal)';
  if (isOver) barColor = 'var(--danger)';
  else if (isWarning) barColor = 'var(--warning)';

  return (
    <div className="budget-progress-container">
      <div className="budget-progress-header">
        <span className="progress-percentage">{Math.round(percentage)}%</span>
      </div>
      
      <div className="progress-track">
        <div 
          className="progress-fill"
          style={{ 
            width: `${fillPercentage}%`,
            backgroundColor: barColor,
            boxShadow: `0 0 10px ${barColor}40`
          }}
        />
      </div>
    </div>
  );
};
