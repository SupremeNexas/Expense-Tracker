import React, { useState } from 'react';
import { Calendar, Monitor, DollarSign } from 'lucide-react';

export const SubscriptionForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    billing_cycle: 'monthly',
    renewal_date: new Date().toISOString().substring(0, 10),
    payment_source: 'Primary Card'
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      cost: parseFloat(formData.cost)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="stagger-children">
      <div className="form-group mb-4">
        <label className="form-label">Platform / Service Name</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}><Monitor size={16} /></span>
          <input type="text" name="name" className="form-input" style={{ paddingLeft: '36px' }} value={formData.name} onChange={handleChange} placeholder="e.g. Netflix, AWS" required autoFocus />
        </div>
      </div>

      <div className="form-row mb-4">
        <div className="form-group">
          <label className="form-label">Cost</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}><DollarSign size={16} /></span>
            <input type="number" name="cost" className="form-input" style={{ paddingLeft: '36px' }} value={formData.cost} onChange={handleChange} placeholder="0.00" step="0.01" min="0" required />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Billing Cycle</label>
          <select name="billing_cycle" className="form-select" value={formData.billing_cycle} onChange={handleChange} required>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      <div className="form-row mb-6">
        <div className="form-group">
          <label className="form-label">Next Renewal Date</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}><Calendar size={16} /></span>
            <input type="date" name="renewal_date" className="form-input" style={{ paddingLeft: '36px' }} value={formData.renewal_date} onChange={handleChange} required />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn--secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn--primary">Save Subscription</button>
      </div>
    </form>
  );
};
