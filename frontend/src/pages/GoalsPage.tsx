import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Milestone, CalendarClock, Coins, Target } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/UI/Toast';
import Modal from '../components/UI/Modal';
import { Goal } from '../types';
import { formatCurrency } from '../utils/currency';
import useAuthStore from '../store/authStore';
import EmptyState from '../components/UI/EmptyState';
import { SkeletonCard } from '../components/UI/Skeleton';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';

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
      target_amount: parseFloat(targetAmount),
      current_amount: parseFloat(currentAmount),
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
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          iconName="Milestone"
          title="No savings goals found"
          description="Fund a laptop, high-yield deposit, or debt payoff target to track progress."
          action={
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-premium btn-premium-primary text-xs py-1.5 px-4 cursor-pointer"
            >
              Configure First Goal
            </button>
          }
        />
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
        <form onSubmit={handleCreateGoal} className="space-y-6 font-sans text-text max-w-full">
          {/* Header Info */}
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight">New Savings Goal</h3>
              <p className="text-xs text-muted font-medium">Define milestone metrics for travel, hardware, or rainy days.</p>
            </div>
          </div>

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 font-sans">
              Goal Information
            </div>

            <Input
              label="Goal Name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. MacBook Pro M4, Europe Trip"
              required
              autoFocus
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Target Amount"
                type="number"
                value={targetAmount}
                onChange={e => setTargetAmount(e.target.value)}
                placeholder="100000"
                icon={<span className="text-sm font-semibold text-gray-400 dark:text-gray-500">₹</span>}
                required
              />

              <Input
                label="Initial Savings"
                type="number"
                value={currentAmount}
                onChange={e => setCurrentAmount(e.target.value)}
                placeholder="0"
                icon={<span className="text-sm font-semibold text-gray-400 dark:text-gray-500">₹</span>}
              />
            </div>
          </div>

          <div className="w-full border-t border-border" />

          {/* Section 2: Timeline */}
          <div className="space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 font-sans">
              Timeline
            </div>

            <Input
              label="Target Date Deadline"
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              required
            />
          </div>

          {/* Footer Action Bar */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500/20">
              Add Goal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Goal contribution modal */}
      <Modal
        isOpen={isContributeOpen}
        onClose={() => setIsContributeOpen(false)}
        title=""
      >
        <form onSubmit={handleContributeSubmit} className="space-y-6 font-sans text-text max-w-full">
          {/* Header Info */}
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Add Savings</h3>
              <p className="text-xs text-muted font-medium">Deposit funds into: {selectedGoal?.name}</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Amount to Save"
              type="number"
              value={contribAmount}
              onChange={e => setContribAmount(e.target.value)}
              placeholder="5000"
              icon={<span className="text-sm font-semibold text-gray-400 dark:text-gray-500">₹</span>}
              required
              min="1"
            />

            <Input
              label="Memo / Notes"
              type="text"
              value={contribNotes}
              onChange={e => setContribNotes(e.target.value)}
              placeholder="e.g. Transferred from Bank Account"
            />
          </div>

          {/* Footer Action Bar */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setIsContributeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500/20">
              Log Savings
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}