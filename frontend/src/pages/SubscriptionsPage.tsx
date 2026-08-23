import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Repeat, Trash2, ShieldCheck, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/UI/Toast';
import Modal from '../components/UI/Modal';
import { Subscription } from '../types';
import { formatCurrency } from '../utils/currency';
import useAuthStore from '../store/authStore';
import SpecularButton from '../components/UI/SpecularButton';
import { SubscriptionForm } from '../components/Subscriptions/SubscriptionForm';
import EmptyState from '../components/UI/EmptyState';
import { SkeletonList } from '../components/UI/Skeleton';

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Queries
  const { data: subscriptions = [], isLoading } = useQuery<Subscription[]>({
    queryKey: ['subscriptions'],
    queryFn: () => api.getSubscriptions()
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createSubscription(data),
    onSuccess: () => {
      showToast('Subscription added to tracker!', 'success');
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to save subscription', 'error');
    }
  });

  const toggleCycleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateSubscription(id, data),
    onSuccess: () => {
      showToast('Billing cycle updated successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to toggle billing cycle', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSubscription(id),
    onSuccess: () => {
      showToast('Subscription removed from tracker.', 'success');
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to delete subscription', 'error');
    }
  });

  const handleFormSubmit = (data: { name: string; cost: number; billing_cycle: string; renewal_date: string }) => {
    createMutation.mutate({
      name: data.name,
      cost: data.cost,
      billing_cycle: data.billing_cycle,
      renewal_date: new Date(data.renewal_date).toISOString(),
      is_active: true
    });
  };

  const handleToggleCycle = (sub: Subscription) => {
    const nextCycle = sub.billing_cycle === 'monthly' ? 'yearly' : 'monthly';
    toggleCycleMutation.mutate({
      id: sub.id,
      data: {
        name: sub.name,
        cost: sub.cost,
        billing_cycle: nextCycle,
        renewal_date: sub.renewal_date,
        is_active: sub.is_active
      }
    });
  };

  const handleDelete = (sub: Subscription) => {
    if (window.confirm(`Are you sure you want to stop tracking "${sub.name}"?`)) {
      deleteMutation.mutate(sub.id);
    }
  };

  // Calculations
  const totalMonthlyBurn = subscriptions
    .filter(s => s.is_active)
    .reduce((acc, s) => acc + (s.billing_cycle === 'yearly' ? Number(s.cost) / 12 : Number(s.cost)), 0);

  const totalYearlyBurn = subscriptions
    .filter(s => s.is_active)
    .reduce((acc, s) => acc + (s.billing_cycle === 'monthly' ? Number(s.cost) * 12 : Number(s.cost)), 0);

  return (
    <div className="space-y-6 fade-in-up">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Audits</h1>
          <p className="text-sm text-gray-400 mt-1">Track monthly software burn, hosting plans, and streaming trials.</p>
        </div>
        <SpecularButton
          size="sm"
          radius={14}
          tint="#ffffff"
          tintOpacity={0.1}
          blur={0}
          textColor="#111411"
          lineColor="#111411"
          baseColor="#fdf1e1"
          intensity={1.2}
          shineSize={12}
          shineFade={35}
          thickness={1}
          speed={0.3}
          followMouse
          proximity={200}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Add Subscription
        </SpecularButton>
      </div>

      {/* Burn rate metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Monthly Burn</div>
          <div className="text-3xl font-bold mt-2 font-sans">{formatCurrency(totalMonthlyBurn, user?.baseCurrency)}</div>
          <span className="text-[10px] text-gray-400 font-medium mt-1 inline-block">Debited across cyclic periods</span>
        </div>

        <div className="premium-card">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Projected Yearly Burn</div>
          <div className="text-3xl font-bold mt-2 font-sans">{formatCurrency(totalYearlyBurn, user?.baseCurrency)}</div>
          <span className="text-[10px] text-gray-400 font-medium mt-1 inline-block">Estimated annual contract values</span>
        </div>

        <div className="premium-card">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Software Accounts</div>
          <div className="text-3xl font-bold mt-2 font-sans">{subscriptions.filter(s => s.is_active).length}</div>
          <span className="text-[10px] text-emerald-500 font-medium mt-1 inline-block">Active recurring pipelines</span>
        </div>
      </div>

      {/* Subscription table */}
      <div className="premium-card p-0 overflow-hidden border-black/[0.05] dark:border-white/[0.05]">
        {isLoading ? (
          <div className="p-6">
            <SkeletonList count={3} />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="py-12 px-6">
            <EmptyState
              iconName="Repeat"
              title="No active subscriptions"
              description="Add your digital services to monitor recurring monthly outflows."
              action={
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="btn-premium btn-premium-primary text-xs py-1.5 px-4 cursor-pointer"
                >
                  Add First Subscription
                </button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-black/[0.04] dark:border-white/[0.04] text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="p-4 pl-6">Service Account</th>
                  <th className="p-4">Cost / Cycle</th>
                  <th className="p-4">Cycle</th>
                  <th className="p-4">Renewal date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                {subscriptions.map(sub => (
                  <tr key={sub.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 pl-6 font-semibold">{sub.name}</td>
                    <td className="p-4 font-sans font-medium">{formatCurrency(Number(sub.cost), user?.baseCurrency)}</td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleToggleCycle(sub)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-black/[0.06] dark:border-white/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] cursor-pointer text-xs transition-colors"
                        title="Click to toggle billing cycle"
                      >
                        {sub.billing_cycle === 'monthly' ? (
                          <ToggleLeft className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <ToggleRight className="w-4 h-4 text-emerald-500" />
                        )}
                        <span className="capitalize font-medium text-gray-500">{sub.billing_cycle}</span>
                      </button>
                    </td>
                    <td className="p-4 text-gray-400">{new Date(sub.renewal_date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${sub.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'}
                      `}>
                        {sub.is_active ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button 
                        onClick={() => handleDelete(sub)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Subscription Form Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title=""
      >
        <SubscriptionForm 
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={createMutation.isPending}
        />
      </Modal>
    </div>
  );
}
