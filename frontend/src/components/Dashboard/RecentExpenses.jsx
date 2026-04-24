import React from 'react';
import { format } from 'date-fns';
import * as Icons from 'lucide-react';
import { EmptyState } from '../UI/EmptyState';
import './RecentExpenses.css';

export const RecentExpenses = ({ expenses, loading }) => {
  if (loading) {
    return (
      <div className="recent-expenses glass-card">
        <h3 className="section-title">Recent Expenses</h3>
        <div className="expense-list-mini">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="expense-item-mini skeleton">
              <div className="skeleton-icon"></div>
              <div className="skeleton-details">
                <div className="skeleton-line" style={{ width: '60%' }}></div>
                <div className="skeleton-line" style={{ width: '40%' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="recent-expenses glass-card">
      <h3 className="section-title">Recent Expenses</h3>
      
      {expenses.length === 0 ? (
        <EmptyState 
          iconName="Receipt" 
          title="No recent expenses" 
          description="You haven't added any expenses yet."
        />
      ) : (
        <div className="expense-list-mini">
          {expenses.slice(0, 5).map(expense => {
            const Icon = Icons[expense.category_icon] || Icons.Tag;
            return (
              <div key={expense.id} className="expense-item-mini">
                <div 
                  className="expense-icon" 
                  style={{ backgroundColor: `${expense.category_color}20`, color: expense.category_color }}
                >
                  <Icon size={18} />
                </div>
                <div className="expense-details">
                  <div className="expense-title">{expense.title}</div>
                  <div className="expense-meta">
                    <span className="expense-category">{expense.category_name}</span>
                    <span className="expense-date">{format(new Date(expense.date), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
                <div className="expense-amount">
                  ${expense.amount.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
