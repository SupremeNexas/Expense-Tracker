import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Category, Wallet } from '../../types';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { Button } from '../UI/Button';

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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-full font-sans text-text">
      {/* Title */}
      <Input
        label="Description Title"
        type="text"
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="e.g. Uber ride to airport"
        required
        autoFocus
      />

      <div className="w-full border-t border-border" />

      {/* Amount & Transaction Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Amount"
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          placeholder="0.00"
          step="0.01"
          min="0.01"
          icon={<span className="text-sm font-semibold text-gray-400 dark:text-gray-500">₹</span>}
          required
        />

        <Select
          label="Transaction Type"
          name="type"
          value={formData.type}
          onChange={handleChange}
        >
          <option value="EXPENSE">Debit (Expense)</option>
          <option value="INCOME">Credit (Income)</option>
        </Select>
      </div>

      {/* Category & Wallet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Category"
          name="categoryId"
          value={formData.categoryId}
          onChange={handleChange}
          required
        >
          <option value="" disabled>Select category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </Select>

        <Select
          label="Wallet / Source"
          name="walletId"
          value={formData.walletId}
          onChange={handleChange}
          required
        >
          <option value="" disabled>Select wallet</option>
          {wallets.map(w => (
            <option key={w.id} value={w.id}>{w.name} (₹{Number(w.balance).toLocaleString()})</option>
          ))}
        </Select>
      </div>

      {/* Date & Payment Method */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Date"
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />

        <Select
          label="Payment Method"
          name="paymentMethod"
          value={formData.paymentMethod}
          onChange={handleChange}
        >
          <option value="Card">Credit/Debit Card</option>
          <option value="Cash">Cash</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="UPI">UPI / Digital Wallet</option>
        </Select>
      </div>

      {/* Tags */}
      <Input
        label="Tags (comma separated)"
        type="text"
        name="tags"
        value={formData.tags}
        onChange={handleChange}
        placeholder="e.g. travel, office, food"
      />

      {/* Notes */}
      <div className="flex flex-col text-left">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5 font-sans">
          Notes
        </label>
        <textarea
          name="notes"
          className="w-full p-4 min-h-[90px] rounded-[14px] bg-black/[0.02] dark:bg-white/[0.02] border border-border text-sm outline-none transition-all duration-200 resize-none hover:border-black/[0.12] dark:hover:border-white/[0.12] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-sans"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Add any extra details here..."
        />
      </div>

      {/* Receipt Image URL & Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Receipt Image URL"
          type="text"
          name="receiptUrl"
          value={formData.receiptUrl}
          onChange={handleChange}
          placeholder="https://image-link.com/receipt.jpg"
        />

        <Input
          label="Location"
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="City or merchant address"
        />
      </div>

      {/* Recurring Checkbox */}
      <div className="flex items-center gap-3 p-3.5 bg-black/[0.01] dark:bg-white/[0.01] border border-border rounded-[14px]">
        <input
          type="checkbox"
          id="isRecurring"
          name="isRecurring"
          className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-border cursor-pointer"
          checked={formData.isRecurring}
          onChange={handleCheckboxChange}
        />
        <label htmlFor="isRecurring" className="text-xs font-semibold text-gray-600 dark:text-gray-400 cursor-pointer">
          Recurring Transaction (logs monthly automatically)
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t border-border">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500/20">
          Save Transaction
        </Button>
      </div>
    </form>
  );
}

export default ExpenseForm;
