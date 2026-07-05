import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Category, Wallet } from '../../types';

interface ExpenseFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function ExpenseForm({ initialData, onSubmit, onCancel }: ExpenseFormProps) {
  // Fetch categories & wallets
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.getCategories()
  });

  const { data: wallets = [] } = useQuery<Wallet[]>({
    queryKey: ['wallets'],
    queryFn: () => api.request('/expenses/wallets')
  });

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'EXPENSE',
    categoryId: '',
    walletId: '',
    paymentMethod: 'UPI',
    tags: '',
    notes: '',
    date: new Date().toISOString().substring(0, 10),
    location: '',
    receiptUrl: '',
    isRecurring: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        amount: String(initialData.amount),
        type: initialData.type || 'EXPENSE',
        categoryId: initialData.categoryId || initialData.category_id || '',
        walletId: initialData.walletId || '',
        paymentMethod: initialData.paymentMethod || initialData.payment_method || 'UPI',
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : '',
        notes: initialData.notes || '',
        date: initialData.date ? new Date(initialData.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
        location: initialData.location || '',
        receiptUrl: initialData.receiptUrl || initialData.receipt_url || '',
        isRecurring: !!(initialData.isRecurring || initialData.is_recurring),
      });
    } else {
      if (categories.length > 0) {
        setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
      }
      if (wallets.length > 0) {
        setFormData(prev => ({ ...prev, walletId: wallets[0].id }));
      }
    }
  }, [initialData, categories, wallets]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
      tags: parsedTags,
      date: new Date(formData.date).toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-full font-sans text-black dark:text-white">
      {/* Title */}
      <div className="flex flex-col">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">
          Description Title
        </label>
        <input 
          type="text" 
          name="title" 
          className="w-full px-4 h-[54px] rounded-[16px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" 
          value={formData.title} 
          onChange={handleChange} 
          placeholder="e.g. Uber ride to airport"
          required 
          autoFocus
        />
      </div>

      <div className="w-full border-t border-black/[0.04] dark:border-white/[0.04]" />

      {/* Amount & Transaction Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">
            Amount
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400 dark:text-gray-500 text-lg font-medium">₹</span>
            <input 
              type="number" 
              name="amount" 
              className="w-full pl-8 pr-4 h-[54px] rounded-[16px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-lg font-semibold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" 
              value={formData.amount} 
              onChange={handleChange} 
              placeholder="0.00"
              step="0.01" 
              min="0.01" 
              required 
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">
            Transaction Type
          </label>
          <div className="relative w-full">
            <select 
              name="type" 
              className="w-full px-4 h-[54px] rounded-[16px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23707070%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_16px_center] bg-no-repeat"
              value={formData.type} 
              onChange={handleChange}
            >
              <option value="EXPENSE">Debit (Expense)</option>
              <option value="INCOME">Credit (Income)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category & Wallet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">
            Category
          </label>
          <select 
            name="categoryId" 
            className="w-full px-4 h-[54px] rounded-[16px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23707070%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_16px_center] bg-no-repeat"
            value={formData.categoryId} 
            onChange={handleChange} 
            required
          >
            <option value="" disabled>Select category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">
            Wallet / Source
          </label>
          <select 
            name="walletId" 
            className="w-full px-4 h-[54px] rounded-[16px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23707070%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_16px_center] bg-no-repeat"
            value={formData.walletId} 
            onChange={handleChange} 
            required
          >
            <option value="" disabled>Select wallet</option>
            {wallets.map(w => (
              <option key={w.id} value={w.id}>{w.name} (₹{Number(w.balance).toLocaleString()})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Date & Payment Method */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">
            Date
          </label>
          <input 
            type="date" 
            name="date" 
            className="w-full px-4 h-[54px] rounded-[16px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" 
            value={formData.date} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">
            Payment Method
          </label>
          <select 
            name="paymentMethod" 
            className="w-full px-4 h-[54px] rounded-[16px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23707070%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_16px_center] bg-no-repeat"
            value={formData.paymentMethod} 
            onChange={handleChange}
          >
            <option value="Card">Credit/Debit Card</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="UPI">UPI / Digital Wallet</option>
          </select>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-col">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">
          Tags (comma separated)
        </label>
        <input 
          type="text" 
          name="tags" 
          className="w-full px-4 h-[54px] rounded-[16px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" 
          value={formData.tags} 
          onChange={handleChange} 
          placeholder="e.g. travel, office, food"
        />
      </div>

      {/* Notes */}
      <div className="flex flex-col">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">
          Notes
        </label>
        <textarea 
          name="notes" 
          className="w-full p-4 min-h-[90px] rounded-[16px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 resize-none" 
          value={formData.notes} 
          onChange={handleChange} 
          placeholder="Add any extra details here..."
        />
      </div>

      {/* Receipt Image URL & Location & Recurring */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="flex flex-col">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">
            Receipt Image URL
          </label>
          <input 
            type="text" 
            name="receiptUrl" 
            className="w-full px-4 h-[54px] rounded-[16px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" 
            value={formData.receiptUrl} 
            onChange={handleChange} 
            placeholder="https://image-link.com/receipt.jpg"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">
            Location
          </label>
          <input 
            type="text" 
            name="location" 
            className="w-full px-4 h-[54px] rounded-[16px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" 
            value={formData.location} 
            onChange={handleChange} 
            placeholder="City or merchant address"
          />
        </div>
      </div>

      {/* Recurring Checkbox */}
      <div className="flex items-center gap-3 p-3.5 bg-black/[0.01] dark:bg-white/[0.01] border border-black/[0.06] dark:border-white/[0.06] rounded-[16px]">
        <input 
          type="checkbox" 
          id="isRecurring"
          name="isRecurring"
          className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-black/[0.08] dark:border-white/[0.08] cursor-pointer"
          checked={formData.isRecurring} 
          onChange={handleCheckboxChange} 
        />
        <label htmlFor="isRecurring" className="text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
          Recurring Transaction (logs monthly automatically)
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t border-black/[0.04] dark:border-white/[0.04]">
        <button 
          type="button" 
          className="px-6 h-[48px] rounded-[14px] text-sm font-medium border border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] active:scale-[0.98] transition-all cursor-pointer text-gray-500 dark:text-gray-400" 
          onClick={onCancel}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="px-6 h-[48px] rounded-[14px] text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          Save Transaction
        </button>
      </div>
    </form>
  );
}
export default ExpenseForm;
