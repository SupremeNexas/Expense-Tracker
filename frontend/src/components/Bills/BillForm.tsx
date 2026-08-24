import React, { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { Button } from '../UI/Button';

interface BillFormProps {
  onSubmit: (data: { name: string; amount: number; due_date: string; status: string; category: string }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialData?: {
    name: string;
    amount: number;
    due_date: string;
    status: string;
    category: string;
  };
}

export function BillForm({ onSubmit, onCancel, isSubmitting = false, initialData }: BillFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    amount: initialData?.amount ? String(initialData.amount) : '',
    due_date: initialData?.due_date
      ? new Date(initialData.due_date).toISOString().substring(0, 10)
      : new Date().toISOString().substring(0, 10),
    status: initialData?.status || 'pending',
    category: initialData?.category || 'Utilities'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-sans text-text max-w-full">
      {/* Header Info */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
          <CalendarClock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight">New Recurring Bill</h3>
          <p className="text-xs text-muted">Track and log upcoming monthly utility dues.</p>
        </div>
      </div>

      {/* Section 1: Basic Information */}
      <div className="space-y-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 font-sans">
          Basic Information
        </div>

        <Input
          label="Bill Name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Electricity, Internet subscription"
          required
          autoFocus
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Amount Due"
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
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="Utilities">Utilities</option>
            <option value="Rent">Rent</option>
            <option value="Insurance">Insurance</option>
            <option value="Subscription">Subscription</option>
            <option value="Tax">Tax</option>
            <option value="Other">Other</option>
          </Select>
        </div>
      </div>

      <div className="w-full border-t border-border" />

      {/* Section 2: Schedule & Status */}
      <div className="space-y-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 font-sans">
          Schedule & Status
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Due Date"
            type="date"
            name="due_date"
            value={formData.due_date}
            onChange={handleChange}
            required
          />

          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </Select>
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
          Save Bill
        </Button>
      </div>
    </form>
  );
}

export default BillForm;
