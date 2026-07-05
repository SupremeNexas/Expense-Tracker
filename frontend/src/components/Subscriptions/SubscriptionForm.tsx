import React, { useState } from 'react';
import { RefreshCcw, Monitor, Calendar } from 'lucide-react';

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
    <form onSubmit={handleSubmit} className="space-y-6 font-sans text-black dark:text-white max-w-full">
      {/* Header Info */}
      <div className="flex items-center gap-3 pb-4 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
          <RefreshCcw className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold tracking-tight">New Subscription</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Monitor recurring service payments and billing periods.</p>
        </div>
      </div>

      {/* Section 1: Basic Information */}
      <div className="space-y-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Basic Information
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-gray-400" /> Platform / Service Name
          </label>
          <input 
            type="text" 
            name="name"
            className="w-full px-4 h-[56px] rounded-[18px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" 
            value={formData.name} 
            onChange={handleChange} 
            placeholder="e.g. Netflix, Spotify, OpenAI"
            required 
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <span className="text-gray-400 font-medium">₹</span> Recurring Cost
            </label>
            <input 
              type="number" 
              name="cost"
              className="w-full px-4 h-[56px] rounded-[18px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" 
              value={formData.cost} 
              onChange={handleChange} 
              placeholder="0.00"
              step="0.01" 
              min="0.01" 
              required 
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Billing Interval
            </label>
            <select 
              name="billing_cycle"
              className="w-full px-4 h-[56px] rounded-[18px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23707070%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_16px_center] bg-no-repeat"
              value={formData.billing_cycle} 
              onChange={handleChange}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>
      </div>

      <div className="w-full border-t border-black/[0.04] dark:border-white/[0.04]" />

      {/* Section 2: Schedule */}
      <div className="space-y-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Renewal Timeline
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" /> Next Renewal Date
          </label>
          <input 
            type="date" 
            name="renewal_date"
            className="w-full px-4 h-[56px] rounded-[18px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" 
            value={formData.renewal_date} 
            onChange={handleChange} 
            required 
          />
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
          {isSubmitting ? 'Logging...' : 'Log Subscription'}
        </button>
      </div>
    </form>
  );
}
export default SubscriptionForm;
