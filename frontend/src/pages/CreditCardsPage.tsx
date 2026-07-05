import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CreditCard as CardIcon, Trash2, AlertTriangle, Sparkles, CheckCircle } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/UI/Toast';
import Modal from '../components/UI/Modal';
import { CreditCard } from '../types';
import { formatCurrency } from '../utils/currency';
import useAuthStore from '../store/authStore';
import { CreditCardForm } from '../components/CreditCards/CreditCardForm';

export default function CreditCardsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Queries
  const { data: cards = [], isLoading } = useQuery<CreditCard[]>({
    queryKey: ['credit-cards'],
    queryFn: () => api.getCreditCards()
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createCreditCard(data),
    onSuccess: () => {
      showToast('Credit card tracker registered!', 'success');
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to add card', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCreditCard(id),
    onSuccess: () => {
      showToast('Credit card removed from ledger.', 'success');
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to delete card', 'error');
    }
  });

  const handleFormSubmit = (data: { name: string; limit_amount: number; due_date: string }) => {
    createMutation.mutate({
      name: data.name,
      limit_amount: data.limit_amount,
      due_date: new Date(data.due_date).toISOString(),
      total_due: 0,
      minimum_due: 0
    });
  };

  const handleDelete = (id: string, cardName: string) => {
    if (window.confirm(`Are you sure you want to remove "${cardName}"? This action deletes corresponding metrics.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 fade-in-up">
      {/* Page Header */}
      <div className="flex justify-between items-center pb-4 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credit Liabilities</h1>
          <p className="text-sm text-gray-400 mt-1">Track limits, credit card balances, and upcoming due cycles.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-premium btn-premium-primary gap-2 cursor-pointer py-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Card
        </button>
      </div>

      {/* Grid of Credit cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="premium-card h-48 animate-pulse bg-gray-200 dark:bg-gray-800 border-black/[0.04] dark:border-white/[0.04]" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="premium-card flex flex-col items-center justify-center text-center py-20 border-dashed border-2 border-black/[0.06] dark:border-white/[0.06]">
          <CardIcon className="w-12 h-12 text-gray-400 mb-3" />
          <h4 className="text-base font-semibold">No credit cards added</h4>
          <p className="text-xs text-gray-400 mt-1 max-w-[280px]">Add your credit accounts to monitor usage percentages and payment calendars.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(card => {
            const limit = Number(card.limit_amount || 0);
            const due = Number(card.total_due || 0);
            const usage = limit > 0 ? (due / limit) * 100 : 0;
            const daysLeft = card.days_until_due ?? 0;
            
            // Risk assessment based on usage threshold
            let riskColor = 'bg-emerald-500';
            let riskText = 'Low Risk';
            if (usage > 30 && usage <= 60) {
              riskColor = 'bg-yellow-500';
              riskText = 'Medium Risk';
            } else if (usage > 60) {
              riskColor = 'bg-red-500';
              riskText = 'High Risk';
            }

            return (
              <div key={card.id} className="premium-card relative overflow-hidden flex flex-col justify-between border-black/[0.05] dark:border-white/[0.05]">
                {/* Risk Line Indicator */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${riskColor}`} />

                <div className="flex justify-between items-start pt-2">
                  <div>
                    <h3 className="text-base font-bold">{card.name}</h3>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">CREDIT CARD ACCOUNT</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDelete(card.id, card.name)}
                      className="p-1 rounded-lg hover:bg-red-500/10 text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress usage meter */}
                <div className="my-6">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Usage: {usage.toFixed(0)}%</span>
                    <span>Limit: {formatCurrency(limit, user?.baseCurrency)}</span>
                  </div>
                  <div className="w-full bg-black/5 dark:bg-white/5 h-2 rounded-full overflow-hidden border border-black/[0.02] dark:border-white/[0.02]">
                    <div 
                      className={`h-full ${riskColor}`} 
                      style={{ width: `${Math.min(usage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2.5">
                    <span className="text-[10px] uppercase font-bold text-gray-400 font-mono">
                      Due: {formatCurrency(due, user?.baseCurrency)}
                    </span>
                    <span className="text-[9px] font-bold text-white px-2 py-0.5 rounded-full uppercase tracking-wider bg-black dark:bg-white/[0.08]">
                      {riskText}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between pt-3 border-t border-black/[0.04] dark:border-white/[0.04]">
                  <div>
                    <div className="text-[9px] text-gray-400 uppercase font-semibold">Min Due</div>
                    <div className="text-xs font-bold">{formatCurrency(Number(card.minimum_due || 0), user?.baseCurrency)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-gray-400 uppercase font-semibold">Payment in</div>
                    <div className={`text-xs font-bold ${daysLeft <= 5 ? 'text-red-500 font-black' : ''}`}>
                      {daysLeft} Days
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Credit card modal creation form */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title=""
      >
        <CreditCardForm 
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={createMutation.isPending}
        />
      </Modal>
    </div>
  );
}
