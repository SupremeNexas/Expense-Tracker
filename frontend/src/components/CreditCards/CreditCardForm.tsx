import React, { useState } from 'react';
import { CreditCard, Calendar } from 'lucide-react';

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
    <form onSubmit={handleSubmit} className="space-y-6 font-sans text-black dark:text-white max-w-full">
      {/* Header Info */}
      <div className="flex items-center gap-3 pb-4 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold tracking-tight">New Credit Card</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Manage your credit cards, limits, and billing cycles.</p>
        </div>
      </div>

      {/* Section 1: Basic Information */}
      <div className="space-y-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Basic Information
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-gray-400" /> Card Name
          </label>
          <input 
            type="text" 
            name="name"
            className="w-full px-4 h-[56px] rounded-[18px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" 
            value={formData.name} 
            onChange={handleChange} 
            placeholder="e.g. Sapphire Preferred, Apple Card"
            required 
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <span className="text-gray-400 font-medium">₹</span> Credit Limit
            </label>
            <input 
              type="number" 
              name="limit_amount"
              className="w-full px-4 h-[56px] rounded-[18px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" 
              value={formData.limit_amount} 
              onChange={handleChange} 
              placeholder="0.00"
              step="0.01" 
              min="0.01" 
              required 
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" /> Next Due Date
            </label>
            <input 
              type="date" 
              name="due_date"
              className="w-full px-4 h-[56px] rounded-[18px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" 
              value={formData.due_date} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>
      </div>

      {/* Footer Action Bar */}
      <div className="flex justify-end gap-3 pt-6 border-t border-black/[0.04] dark:border-white/[0.04]">
        <button 
          type="button" 
          className="px-6 h-[48px] rounded-[14px] text-sm font-medium border border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] active:scale-[0.98] transition-all cursor-pointer text-gray-500 dark:text-gray-400" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="px-6 h-[48px] rounded-[14px] text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Credit Card'}
        </button>
      </div>
    </form>
  );
}
export default CreditCardForm;
