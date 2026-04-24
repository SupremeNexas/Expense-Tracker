import React, { useState } from 'react';
import { CreditCard, DollarSign, Calendar } from 'lucide-react';

export const CreditCardForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    limit_amount: '',
    due_date: new Date().toISOString().substring(0, 10)
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      limit_amount: parseFloat(formData.limit_amount)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="stagger-children">
      <div className="form-group mb-4">
        <label className="form-label">Card Name</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}><CreditCard size={16} /></span>
          <input type="text" name="name" className="form-input" style={{ paddingLeft: '36px' }} value={formData.name} onChange={handleChange} placeholder="e.g. Chase Sapphire" required autoFocus />
        </div>
      </div>

      <div className="form-group mb-4">
        <label className="form-label">Credit Limit</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}><DollarSign size={16} /></span>
          <input type="number" name="limit_amount" className="form-input" style={{ paddingLeft: '36px' }} value={formData.limit_amount} onChange={handleChange} placeholder="0.00" step="0.01" min="0" required />
        </div>
      </div>

      <div className="form-group mb-6">
        <label className="form-label">Next Due Date</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}><Calendar size={16} /></span>
          <input type="date" name="due_date" className="form-input" style={{ paddingLeft: '36px' }} value={formData.due_date} onChange={handleChange} required />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn--secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn--primary">Save Credit Card</button>
      </div>
    </form>
  );
};
