import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';

export const BudgetForm = ({ initialData, month, year, onSubmit, onCancel }) => {
  const { categories } = useAppContext();
  
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    period: 'monthly'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        category_id: initialData.category_id,
        amount: initialData.amount,
        period: initialData.period || 'monthly'
      });
    } else if (categories.length > 0) {
      setFormData(prev => ({ ...prev, category_id: categories[0].id }));
    }
  }, [initialData, categories]);

  const validate = () => {
    const newErrors = {};
    if (!formData.category_id) newErrors.category_id = 'Category is required';
    if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ ...formData, month, year });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group mb-4">
        <label htmlFor="category_id" className="form-label">Category</label>
        <select
          id="category_id"
          name="category_id"
          className="form-select"
          value={formData.category_id}
          onChange={handleChange}
          disabled={!!initialData} // Don't allow changing category when editing
        >
          <option value="" disabled>Select a category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.category_id && <div className="form-error">{errors.category_id}</div>}
      </div>

      <div className="form-group mb-6">
        <label htmlFor="amount" className="form-label">Budget Amount ($)</label>
        <input
          type="number"
          id="amount"
          name="amount"
          className="form-input"
          value={formData.amount}
          onChange={handleChange}
          placeholder="0.00"
          step="0.01"
          min="0.01"
          autoFocus
        />
        {errors.amount && <div className="form-error">{errors.amount}</div>}
      </div>

      <div className="form-row">
        <button 
          type="button" 
          className="btn btn--secondary" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn btn--primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Budget'}
        </button>
      </div>
    </form>
  );
};
