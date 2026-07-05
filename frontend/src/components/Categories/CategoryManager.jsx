import React from 'react';
import * as Icons from 'lucide-react';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { EmptyState } from '../UI/EmptyState';
import { formatCurrency } from '../../utils/currency';
import './CategoryManager.css';

export const CategoryManager = ({ categories, loading, onAdd, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="category-grid">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="category-card glass-card skeleton" style={{ height: '140px' }}>
            <div className="skeleton-icon" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
            <div className="skeleton-line mt-4" style={{ width: '60%', height: '16px' }}></div>
            <div className="skeleton-line" style={{ width: '40%', height: '12px', marginTop: '8px' }}></div>
          </div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <EmptyState 
        iconName="Tags"
        title="No categories"
        description="Create categories to organize your expenses."
        action={
          <button className="btn btn--primary" onClick={onAdd}>
            <Plus size={18} /> Add Category
          </button>
        }
      />
    );
  }

  return (
    <div className="category-grid stagger-children">
      {/* Add New Card */}
      <div className="category-card category-card--add glass-card" onClick={onAdd}>
        <div className="add-icon-wrapper">
          <Plus size={24} />
        </div>
        <div className="add-text">Add Category</div>
      </div>

      {categories.map(category => {
        const Icon = Icons[category.icon] || Icons.Tag;
        
        return (
          <div key={category.id} className="category-card glass-card">
            <div className="category-card__header">
              <div 
                className="category-icon"
                style={{ 
                  backgroundColor: `${category.color}20`, 
                  color: category.color 
                }}
              >
                <Icon size={20} />
              </div>
              <div className="category-actions">
                <button className="action-btn edit" onClick={() => onEdit(category)}>
                  <Edit2 size={14} />
                </button>
                <button className="action-btn delete" onClick={() => onDelete(category)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <div className="category-card__body">
              <h4 className="category-name">{category.name}</h4>
              <div className="category-stats">
                <span className="stat-value">{category.expense_count || 0}</span> expenses
              </div>
              <div className="category-total">
                {formatCurrency(category.total_spent || 0)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
