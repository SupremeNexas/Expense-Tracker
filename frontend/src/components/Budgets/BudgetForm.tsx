import React, { useState, useEffect } from 'react';
import { PiggyBank } from 'lucide-react';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { Button } from '../UI/Button';

interface Category {
  id: string;
  name: string;
}

interface BudgetFormProps {
  categories: Category[];
  onSubmit: (data: { category_id: string; amount: number }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function BudgetForm({ categories, onSubmit, onCancel, isSubmitting = false }: BudgetFormProps) {
  const [formData, setFormData] = useState({
    category_id: '',
    amount: ''
  });

  useEffect(() => {
    if (categories.length > 0 && !formData.category_id) {
      setFormData(prev => ({ ...prev, category_id: categories[0].id }));
    }
  }, [categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id || !formData.amount) return;
    onSubmit({
      category_id: formData.category_id,
      amount: parseFloat(formData.amount)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-sans text-text max-w-full">
      {/* Header Info */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <PiggyBank className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight">New Budget Cap</h3>
          <p className="text-xs text-muted">Set monthly spending limits per category.</p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="space-y-4">
        <Select
          label="Category"
          name="category_id"
          value={formData.category_id}
          onChange={handleChange}
          required
        >
          <option value="" disabled>Select category</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>

        <Input
          label="Monthly Limit Amount"
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          placeholder="0.00"
          min="1"
          icon={<span className="text-sm font-semibold text-gray-400 dark:text-gray-500">₹</span>}
          required
        />
      </div>

      {/* Footer Action Bar */}
      <div className="flex justify-end gap-3 pt-6 border-t border-border">
        <Button 
          type="button" 
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="primary"
          className="bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500/20"
          loading={isSubmitting}
        >
          Configure Limit
        </Button>
      </div>
    </form>
  );
}

export default BudgetForm;
