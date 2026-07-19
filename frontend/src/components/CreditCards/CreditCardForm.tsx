import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';

interface CreditCardFormProps {
  onSubmit: (data: { name: string; limit_amount: number; due_date: string }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CreditCardForm({ onSubmit, onCancel, isSubmitting = false }: CreditCardFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    limit_amount: '',
    due_date: new Date().toISOString().substring(0, 10)
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      limit_amount: parseFloat(formData.limit_amount)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-sans text-text max-w-full">
      {/* Header Info */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight">New Credit Card</h3>
          <p className="text-xs text-muted">Manage your credit cards, limits, and billing cycles.</p>
        </div>
      </div>

      {/* Section 1: Basic Information */}
      <div className="space-y-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 font-sans">
          Basic Information
        </div>

        <Input
          label="Card Name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Sapphire Preferred, Apple Card"
          required
          autoFocus
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Credit Limit"
            type="number"
            name="limit_amount"
            value={formData.limit_amount}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            icon={<span className="text-sm font-semibold text-gray-400 dark:text-gray-500">₹</span>}
            required
          />

          <Input
            label="Next Due Date"
            type="date"
            name="due_date"
            value={formData.due_date}
            onChange={handleChange}
            required
          />
        </div>
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
          Save Credit Card
        </Button>
      </div>
    </form>
  );
}

export default CreditCardForm;
