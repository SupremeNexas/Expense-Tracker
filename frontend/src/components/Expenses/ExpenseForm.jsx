import React, { useState, useEffect } from 'react';
import { Calendar, Tag, CreditCard, AlignLeft, Hash } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export const ExpenseForm = ({ initialData, onSubmit, onCancel }) => {
  const { categories } = useAppContext();
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category_id: '',
    date: new Date().toISOString().substring(0, 10),
    payment_method: 'Card',
    tags: '',
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        amount: initialData.amount,
        category_id: initialData.category_id,
        date: initialData.date,
        payment_method: initialData.payment_method || 'Card',
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : '',
        notes: initialData.notes || ''
      });
    } else if (categories.length > 0) {
      setFormData(prev => ({ ...prev, category_id: categories[0].id }));
    }
  }, [initialData, categories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // parse tags string into array
    const parsedTags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
    
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
      category_id: parseInt(formData.category_id, 10),
      tags: parsedTags
    });
  };

  return (
    <form onSubmit={handleSubmit} className="stagger-children">
      <div className="form-group mb-4">
        <label className="form-label">What did you spend on?</label>
        <input 
          type="text" 
          name="title" 
          className="form-input" 
          value={formData.title} 
          onChange={handleChange} 
          placeholder="e.g. Uber ride to airport"
          required 
          autoFocus
        />
      </div>

      <div className="form-row mb-4">
        <div className="form-group">
          <label className="form-label">Amount</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>$</span>
            <input 
              type="number" 
              name="amount" 
              className="form-input" 
              style={{ paddingLeft: '28px' }}
              value={formData.amount} 
              onChange={handleChange} 
              placeholder="0.00"
              step="0.01" 
              min="0.01" 
              required 
            />
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Category</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}><Tag size={16} /></span>
            <select 
              name="category_id" 
              className="form-select" 
              style={{ paddingLeft: '36px' }}
              value={formData.category_id} 
              onChange={handleChange} 
              required
            >
              <option value="" disabled>Select category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="form-row mb-4">
        <div className="form-group">
          <label className="form-label">Date</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}><Calendar size={16} /></span>
            <input 
              type="date" 
              name="date" 
              className="form-input" 
              style={{ paddingLeft: '36px' }}
              value={formData.date} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Payment Method</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}><CreditCard size={16} /></span>
            <select 
              name="payment_method" 
              className="form-select" 
              style={{ paddingLeft: '36px' }}
              value={formData.payment_method} 
              onChange={handleChange}
            >
              <option value="Card">Credit/Debit Card</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI/Wallet">UPI/Wallet</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-group mb-4">
        <label className="form-label">Tags (comma separated)</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}><Hash size={16} /></span>
          <input 
            type="text" 
            name="tags" 
            className="form-input" 
            style={{ paddingLeft: '36px' }}
            value={formData.tags} 
            onChange={handleChange} 
            placeholder="e.g. travel, business"
          />
        </div>
      </div>

      <div className="form-group mb-6">
        <label className="form-label">Notes (Optional)</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-secondary)' }}><AlignLeft size={16} /></span>
          <textarea 
            name="notes" 
            className="form-textarea" 
            style={{ paddingLeft: '36px', minHeight: '80px', resize: 'vertical' }}
            value={formData.notes} 
            onChange={handleChange} 
            placeholder="Add any extra details here..."
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn--secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary">
          {initialData ? 'Save Changes' : 'Add Expense'}
        </button>
      </div>
    </form>
  );
};
