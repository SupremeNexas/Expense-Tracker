import React, { useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { Button } from '../UI/Button';

interface SubscriptionFormProps {
  onSubmit: (data: { name: string; cost: number; billing_cycle: string; renewal_date: string }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function SubscriptionForm({ onSubmit, onCancel, isSubmitting = false }: SubscriptionFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    billing_cycle: 'monthly',
    renewal_date: new Date().toISOString().substring(0, 10)
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      cost: parseFloat(formData.cost)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-sans text-text max-w-full">
      {/* Header Info */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
          <RefreshCcw className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight">New Subscription</h3>
          <p className="text-xs text-muted">Monitor recurring service payments and billing periods.</p>
        </div>
      </div>

      {/* Section 1: Basic Information */}
      <div className="space-y-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 font-sans">
          Basic Information
        </div>

        <Input
          label="Platform / Service Name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Netflix, Spotify, OpenAI"
          required
          autoFocus
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Recurring Cost"
            type="number"
            name="cost"
            value={formData.cost}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            icon={<span className="text-sm font-semibold text-gray-400 dark:text-gray-500">₹</span>}
            required
          />

          <Select
            label="Billing Interval"
            name="billing_cycle"
            value={formData.billing_cycle}
            onChange={handleChange}
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </Select>
        </div>
      </div>

      <div className="w-full border-t border-border" />

      {/* Section 2: Schedule */}
      <div className="space-y-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 font-sans">
          Renewal Timeline
        </div>

        <Input
          label="Next Renewal Date"
          type="date"
          name="renewal_date"
          value={formData.renewal_date}
          onChange={handleChange}
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
          Log Subscription
        </Button>
      </div>
    </form>
  );
}

export default SubscriptionForm;
