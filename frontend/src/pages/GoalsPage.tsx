import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Milestone, CalendarClock, Coins, Target } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/UI/Toast';
import Modal from '../components/UI/Modal';
import { Goal } from '../types';
import { formatCurrency } from '../utils/currency';
import useAuthStore from '../store/authStore';

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // New Goal Form States
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState(new Date().toISOString().substring(0, 10));

  // Contribute Form States
  const [contribAmount, setContribAmount] = useState('');
  const [contribNotes, setContribNotes] = useState('');

  // Queries
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: () => api.getGoals()
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createGoal(data),
    onSuccess: () => {
      showToast('Savings goal created successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsModalOpen(false);
      resetGoalForm();
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to create goal', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteGoal(id),
    onSuccess: () => {
      showToast('Savings goal removed successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to delete goal', 'error');
    }
  });

  const contributeMutation = useMutation({
    mutationFn: ({ id, amount, notes }: { id: string; amount: number; notes: string }) => 
      api.request(`/goals/${id}/contribute`, {
        method: 'POST',
        body: { amount, notes }
      }),
    onSuccess: () => {
      showToast('Milestone contribution recorded!', 'success');
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      setIsContributeOpen(false);
      setContribAmount('');
      setContribNotes('');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to log contribution', 'error');
    }
  });

  const resetGoalForm = () => {
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setDeadline(new Date().toISOString().substring(0, 10));
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount) return;

    createMutation.mutate({
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount),
      deadline: new Date(deadline).toISOString()
    });
  };

  const handleContributeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !contribAmount) return;

    contributeMutation.mutate({
      id: selectedGoal.id,
      amount: parseFloat(contribAmount),
      notes: contribNotes
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this savings goal?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 fade-in-up">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
          <p className="text-sm text-gray-400 mt-1">Fund and track milestones like vacations, device upgrades, or emergency reserves.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-premium btn-premium-primary gap-2 cursor-pointer py-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Create Goal
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="premium-card h-48 animate-pulse bg-gray-200 dark:bg-gray-800 border-black/[0.04] dark:border-white/[0.04]" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="premium-card flex flex-col items-center justify-center text-center py-20 border-dashed border-2 border-black/[0.06] dark:border-white/[0.06]">
          <Milestone className="w-12 h-12 text-gray-400 mb-3" />
          <h4 className="text-base font-semibold">No savings goals found</h4>
          <p className="text-xs text-gray-400 mt-1 max-w-[280px]">Fund a laptop, high-yield deposit, or debt payoff target to track progress.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map(g => {
            const current = Number(g.current_amount || 0);
            const target = Number(g.target_amount || 0);
            const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0;
            const daysLeft = Math.ceil((new Date(g.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

            return (
              <div key={g.id} className="premium-card flex flex-col justify-between border-black/[0.05] dark:border-white/[0.05]">
                {/* Title & Delete */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold">{g.name}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 uppercase mt-0.5 font-semibold">
                      <CalendarClock className="w-3 h-3" />
                      <span>{daysLeft > 0 ? `${daysLeft} days remaining` : 'Target Passed'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(g.id)}
                    className="p-1 rounded-lg hover:bg-red-500/10 text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="my-6">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>{percent.toFixed(0)}% Saved</span>
                    <span>Target: {formatCurrency(target, user?.baseCurrency)}</span>
                  </div>
                  <div className="w-full bg-black/5 dark:bg-white/5 h-2.5 rounded-full overflow-hidden border border-black/[0.02] dark:border-white/[0.02]">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="text-[10px] font-bold text-gray-400 mt-2 uppercase font-mono">
                    Current: {formatCurrency(current, user?.baseCurrency)}
                  </div>
                </div>

                {/* Contribute trigger button */}
                <button 
                  onClick={() => {
                    setSelectedGoal(g);
                    setIsContributeOpen(true);
                  }}
                  className="w-full btn-premium btn-premium-secondary py-2 cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold"
                >
                  <Coins className="w-3.5 h-3.5 text-emerald-500" />
                  Add Savings
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal creation modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title=""
      >
        <form onSubmit={handleCreateGoal} className="space-y-6 font-sans text-black dark:text-white max-w-full">
          {/* Header Info */}
          <div className="flex items-center gap-3 pb-4 border-b border-black/[0.04] dark:border-white/[0.04]">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight">New Savings Goal</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Define milestone metrics for travel, hardware, or rainy days.</p>
            </div>
          </div>

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Goal Information
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                Goal Name
              </label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g. MacBook Pro M4, Europe Trip" 
                className="w-full px-4 h-[56px] rounded-[18px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" 
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <span className="text-gray-400 font-medium">₹</span> Target Amount
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-gray-400 dark:text-gray-500 text-lg font-medium">₹</span>
                  <input 
                    type="number" 
                    value={targetAmount} 
                    onChange={e => setTargetAmount(e.target.value)} 
                    placeholder="100000" 
                    className="w-full pl-8 pr-4 h-[56px] rounded-[18px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" 
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <span className="text-gray-400 font-medium">₹</span> Initial Savings
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-gray-400 dark:text-gray-500 text-lg font-medium">₹</span>
                  <input 
                    type="number" 
                    value={currentAmount} 
                    onChange={e => setCurrentAmount(e.target.value)} 
                    placeholder="0" 
                    className="w-full pl-8 pr-4 h-[56px] rounded-[18px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="w-full border-t border-black/[0.04] dark:border-white/[0.04]" />

          {/* Section 2: Timeline */}
          <div className="space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Timeline
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                Target Date Deadline
              </label>
              <input 
                type="date" 
                value={deadline} 
                onChange={e => setDeadline(e.target.value)} 
                className="w-full px-4 h-[56px] rounded-[18px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" 
                required
              />
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="flex justify-end gap-3 pt-6 border-t border-black/[0.04] dark:border-white/[0.04]">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-6 h-[48px] rounded-[14px] text-sm font-medium border border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] active:scale-[0.98] transition-all cursor-pointer text-gray-500 dark:text-gray-400" 
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 h-[48px] rounded-[14px] text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              Add Goal
            </button>
          </div>
        </form>
      </Modal>

      {/* Goal contribution modal */}
      <Modal 
        isOpen={isContributeOpen} 
        onClose={() => setIsContributeOpen(false)}
        title=""
      >
        <form onSubmit={handleContributeSubmit} className="space-y-6 font-sans text-black dark:text-white max-w-full">
          {/* Header Info */}
          <div className="flex items-center gap-3 pb-4 border-b border-black/[0.04] dark:border-white/[0.04]">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight">Add Savings</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Deposit funds into: {selectedGoal?.name}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                Amount to Save
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-gray-400 dark:text-gray-500 text-lg font-medium">₹</span>
                <input 
                  type="number" 
                  value={contribAmount} 
                  onChange={e => setContribAmount(e.target.value)} 
                  placeholder="5000" 
                  className="w-full pl-8 pr-4 h-[56px] rounded-[18px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" 
                  required
                  min="1"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                Memo / Notes
              </label>
              <input 
                type="text" 
                value={contribNotes} 
                onChange={e => setContribNotes(e.target.value)} 
                placeholder="e.g. Transferred from Bank Account" 
                className="w-full px-4 h-[56px] rounded-[18px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" 
              />
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="flex justify-end gap-3 pt-6 border-t border-black/[0.04] dark:border-white/[0.04]">
            <button 
              type="button" 
              onClick={() => setIsContributeOpen(false)}
              className="px-6 h-[48px] rounded-[14px] text-sm font-medium border border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] active:scale-[0.98] transition-all cursor-pointer text-gray-500 dark:text-gray-400" 
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 h-[48px] rounded-[14px] text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              Log Savings
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
