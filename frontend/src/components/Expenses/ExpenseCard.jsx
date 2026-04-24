import React from 'react';
import * as LucideIcons from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Edit2, Trash2, CreditCard } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/currency';

export const ExpenseCard = ({ expense, onEdit, onDelete }) => {
  const { user } = useAppContext();
  const Icon = LucideIcons[expense.category_icon] || LucideIcons.MoreHorizontal;
  
  // Format tags safely
  const tags = Array.isArray(expense.tags) ? expense.tags : [];

  return (
    <div className="glass-card" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      padding: 'var(--space-md)',
      gap: 'var(--space-md)',
      transition: 'all var(--transition-fast)'
    }}>
      <div 
        style={{ 
          width: '48px', 
          height: '48px', 
          borderRadius: 'var(--radius-md)', 
          background: `rgba(${hexToRgb(expense.category_color)}, 0.15)`,
          color: expense.category_color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <Icon size={24} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {expense.title}
          </h4>
          <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>
            {formatCurrency(expense.amount, user?.base_currency || 'USD')}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
          <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
            {expense.category_name}
          </span>
          <span style={{ color: 'var(--glass-border)' }}>•</span>
          <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
            {format(parseISO(expense.date), 'MMM d, yyyy')}
          </span>
          {expense.payment_method && (
            <>
              <span style={{ color: 'var(--glass-border)' }}>•</span>
              <span className="text-muted" style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CreditCard size={12} /> {expense.payment_method}
              </span>
            </>
          )}
        </div>

        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
            {tags.map((tag, idx) => (
              <span key={idx} style={{ 
                fontSize: '0.75rem', 
                padding: '2px 8px', 
                background: 'var(--bg-input)', 
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-secondary)'
              }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {expense.notes && (
          <p className="text-muted" style={{ fontSize: '0.8125rem', margin: '8px 0 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {expense.notes}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '4px', opacity: 0.7, flexShrink: 0 }}>
        <button 
          className="btn btn--icon btn--ghost" 
          onClick={() => onEdit(expense)}
          title="Edit"
        >
          <Edit2 size={16} />
        </button>
        <button 
          className="btn btn--icon btn--ghost" 
          onClick={() => onDelete(expense)}
          style={{ color: 'var(--danger)' }}
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

// Helper function to convert hex color to rgb string for rgba()
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
    '128, 128, 128';
}
