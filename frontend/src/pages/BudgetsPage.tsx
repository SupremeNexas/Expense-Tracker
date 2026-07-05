import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Calendar, ShieldCheck, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/UI/Toast';
import Modal from '../components/UI/Modal';
import { Budget, Category } from '../types';
import { formatCurrency } from '../utils/currency';
import useAuthStore from '../store/authStore';
import { BudgetForm } from '../components/Budgets/BudgetForm';

export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Queries
  const { data: budgets = [], isLoading: budgetsLoading } = useQuery<Budget[]>({
    queryKey: ['budgets', month, year],
    queryFn: () => api.getBudgets({ month, year })
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.getCategories()
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createBudget(data),
    onSuccess: () => {
      showToast('Budget configured successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to save budget', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteBudget(id),
    onSuccess: () => {
      showToast('Budget deleted successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to delete budget', 'error');
    }
  });

  const handleFormSubmit = (data: { category_id: string; amount: number }) => {
    createMutation.mutate({
      categoryId: data.category_id,
      amount: data.amount,
      period: 'monthly',
      month,
      year
    });
  };

  const handleDelete = (budget: Budget) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      deleteMutation.mutate(budget.id);
    }
  };

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  return (
    <div className="space-y-6 fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-black/[0.04] dark:border-white/[0.04] gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Planner</h1>
          <p className="text-sm text-gray-400 mt-1">Set monthly category spending caps and monitor limits.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          {/* Month selector */}
          <select 
            value={month} 
            onChange={e => setMonth(parseInt(e.target.value))}
            className="input-premium py-1.5 px-3 text-xs cursor-pointer w-32"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          {/* Year selector */}
          <select 
            value={year} 
            onChange={e => setYear(parseInt(e.target.value))}
            className="input-premium py-1.5 px-3 text-xs cursor-pointer w-24"
          >
            {[2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-premium btn-premium-primary gap-2 cursor-pointer py-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Add Budget
          </button>
        </div>
      </div>

      {/* Grid of budgets with circular progress rings */}
      {budgetsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="premium-card h-48 animate-pulse border-black/[0.04] dark:border-white/[0.04]" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="premium-card flex flex-col items-center justify-center text-center py-20 border-dashed border-2 border-black/[0.06] dark:border-white/[0.06]">
          <Calendar className="w-12 h-12 text-gray-400 mb-3" />
          <h4 className="text-base font-semibold">No budgets configured</h4>
          <p className="text-xs text-gray-400 mt-1 max-w-[280px]">Set a budget cap for dining, transport, or groceries to monitor spent rates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map(b => {
            const spent = Number(b.spent || 0);
            const limit = Number(b.amount || 0);
            const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
            const isOver = spent > limit;
            
            // SVG settings for circular progress ring
            const radius = 50;
            const stroke = 7;
            const normalizedRadius = radius - stroke * 2;
            const circumference = normalizedRadius * 2 * Math.PI;
            const strokeDashoffset = circumference - (percent / 100) * circumference;

            let strokeColor = 'text-emerald-500'; // green
            if (percent > 75 && percent <= 100) strokeColor = 'text-yellow-500'; // yellow
            if (percent > 100 || isOver) strokeColor = 'text-red-500'; // red

            return (
              <div key={b.id} className="premium-card flex items-center justify-between border-black/[0.05] dark:border-white/[0.05]">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.category_color }} />
                      {b.category_name}
                    </h3>
                    <p className="text-[10px] text-gray-400 uppercase mt-0.5 tracking-wider">MONTHLY CAP</p>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">
                      Spent: <span className="font-semibold text-black dark:text-white">{formatCurrency(spent, user?.baseCurrency)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Limit: <span className="font-semibold">{formatCurrency(limit, user?.baseCurrency)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDelete(b)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 hover:opacity-80 cursor-pointer pt-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove cap
                  </button>
                </div>

                {/* Circular ring wrapper */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-24 h-24 transform -rotate-90">
                    {/* Background track circle */}
                    <circle
                      className="text-black/[0.04] dark:text-white/[0.04]"
                      strokeWidth={stroke}
                      stroke="currentColor"
                      fill="transparent"
                      r={normalizedRadius}
                      cx={radius}
                      cy={radius}
                    />
                    {/* Progress tracking circle */}
                    <circle
                      className={`transition-all duration-300 ${strokeColor}`}
                      strokeWidth={stroke}
                      strokeDasharray={circumference + ' ' + circumference}
                      style={{ strokeDashoffset }}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r={normalizedRadius}
                      cx={radius}
                      cy={radius}
                    />
                  </svg>
                  {/* Text index */}
                  <span className="absolute text-xs font-bold font-sans">
                    {percent.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Budget creation modal dialog */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title=""
      >
        <BudgetForm 
          categories={categories}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={createMutation.isPending}
        />
      </Modal>
    </div>
  );
}
