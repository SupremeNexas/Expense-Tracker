import React from 'react';
import { ExpenseCard } from './ExpenseCard';
import { EmptyState } from '../UI/EmptyState';
import './ExpenseList.css';

export const ExpenseList = ({ expenses, loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="expense-list stagger-children">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="expense-card glass-card skeleton" style={{ height: '100px' }}>
            <div className="expense-card__icon skeleton-icon" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)' }}></div>
            <div className="expense-card__content">
              <div className="skeleton-line" style={{ width: '40%', height: '16px', marginBottom: '8px' }}></div>
              <div className="skeleton-line" style={{ width: '60%', height: '12px', marginBottom: '16px' }}></div>
              <div className="skeleton-line" style={{ width: '30%', height: '12px' }}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <EmptyState 
        iconName="Receipt"
        title="No expenses found"
        description="Try adjusting your filters or add a new expense."
      />
    );
  }

  return (
    <div className="expense-list stagger-children">
      {expenses.map(expense => (
        <ExpenseCard 
          key={expense.id} 
          expense={expense} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />
      ))}
    </div>
  );
};
