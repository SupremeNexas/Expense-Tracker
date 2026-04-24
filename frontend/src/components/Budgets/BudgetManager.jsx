import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { Edit2, Trash2, Plus, Calendar } from 'lucide-react';
import { EmptyState } from '../UI/EmptyState';
import { BudgetProgress } from './BudgetProgress';
import './BudgetManager.css';

export const BudgetManager = ({ budgets, loading, month, year, onAdd, onEdit, onDelete, onMonthChange }) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (month === 1) {
      onMonthChange(12, year - 1);
    } else {
      onMonthChange(month - 1, year);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      onMonthChange(1, year + 1);
    } else {
      onMonthChange(month + 1, year);
    }
  };

  const currentMonthName = months[month - 1];

  return (
    <div className="budget-manager">
      <div className="budget-controls glass-card">
        <button className="btn btn--icon btn--ghost" onClick={handlePrevMonth}>
          &larr;
        </button>
        <div className="current-period">
          <Calendar size={18} />
          <span>{currentMonthName} {year}</span>
        </div>
        <button className="btn btn--icon btn--ghost" onClick={handleNextMonth}>
          &rarr;
        </button>
      </div>

      {loading ? (
        <div className="budget-list stagger-children mt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="budget-card glass-card skeleton" style={{ height: '140px' }}>
              <div className="budget-card__header">
                <div className="skeleton-icon" style={{ width: '32px', height: '32px', borderRadius: '50%' }}></div>
                <div className="skeleton-line" style={{ width: '120px', height: '16px' }}></div>
              </div>
              <div className="skeleton-line mt-4" style={{ width: '100%', height: '8px' }}></div>
              <div className="budget-card__footer mt-4">
                <div className="skeleton-line" style={{ width: '60px', height: '12px' }}></div>
                <div className="skeleton-line" style={{ width: '80px', height: '16px' }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="mt-4">
          <EmptyState 
            iconName="Wallet"
            title="No budgets set"
            description={`You haven't set any budgets for ${currentMonthName} ${year}.`}
            action={
              <button className="btn btn--primary" onClick={onAdd}>
                <Plus size={18} /> Create Budget
              </button>
            }
          />
        </div>
      ) : (
        <div className="budget-list stagger-children mt-4">
          {budgets.map(budget => {
            const Icon = Icons[budget.category_icon] || Icons.Tag;
            
            return (
              <div key={budget.id} className="budget-card glass-card">
                <div className="budget-card__header">
                  <div className="budget-category">
                    <div 
                      className="budget-icon"
                      style={{ 
                        backgroundColor: `${budget.category_color}20`, 
                        color: budget.category_color 
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <span className="budget-category-name">{budget.category_name}</span>
                  </div>
                  <div className="budget-actions">
                    <button className="action-btn edit" onClick={() => onEdit(budget)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="action-btn delete" onClick={() => onDelete(budget)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="budget-card__body">
                  <BudgetProgress 
                    spent={budget.spent} 
                    total={budget.amount} 
                    color={budget.category_color} 
                  />
                </div>

                <div className="budget-card__footer">
                  <div className="budget-status">
                    {budget.spent > budget.amount ? (
                      <span className="text-danger">Over budget by ${(budget.spent - budget.amount).toFixed(2)}</span>
                    ) : (
                      <span className="text-success">${(budget.amount - budget.spent).toFixed(2)} left</span>
                    )}
                  </div>
                  <div className="budget-amounts">
                    <span className="spent">${budget.spent.toFixed(2)}</span>
                    <span className="divider">/</span>
                    <span className="total">${budget.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="budget-card budget-card--add glass-card" onClick={onAdd}>
            <div className="add-icon-wrapper">
              <Plus size={24} />
            </div>
            <div className="add-text">Add Budget</div>
          </div>
        </div>
      )}
    </div>
  );
};
