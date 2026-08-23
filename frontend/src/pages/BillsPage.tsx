import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, CalendarClock, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/UI/Toast';
import Modal from '../components/UI/Modal';
import { Bill } from '../types';
import { formatCurrency } from '../utils/currency';
import useAuthStore from '../store/authStore';
import { BillForm } from '../components/Bills/BillForm';
import EmptyState from '../components/UI/EmptyState';
import { SkeletonList } from '../components/UI/Skeleton';
import SpecularButton from '../components/UI/SpecularButton';

export default function BillsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Queries
  const { data: bills = [], isLoading } = useQuery<Bill[]>({
    queryKey: ['bills'],
    queryFn: () => api.request('/bills')
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.request('/bills', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      showToast('Bill scheduled successfully!', 'success');
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to create bill', 'error');
    }
  });

  const togglePaidMutation = useMutation({
    mutationFn: (id: string) =>
      api.request(`/bills/${id}/pay`, { method: 'POST' }),
    onSuccess: () => {
      showToast('Bill status updated!', 'success');
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to update status', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.request(`/bills/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      showToast('Bill removed from timeline.', 'success');
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to delete bill', 'error');
    }
  });

  const handleFormSubmit = (data: { name: string; amount: number; due_date: string; status: string; category: string }) => {
    createMutation.mutate({
      name: data.name,
      amount: data.amount,
      due_date: new Date(data.due_date).toISOString(),
      category: data.category,
      status: data.status
    });
  };

  const handleTogglePaid = (bill: Bill) => {
    togglePaidMutation.mutate({
      id: bill.id,
      isPaid: !bill.is_paid
    });
  };

  const handleDelete = (id: string, billName: string) => {
    if (window.confirm(`Are you sure you want to stop tracking "${billName}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 fade-in-up">
      {/* Page Header */}
      <div className="flex justify-between items-center pb-4 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Utility Bills</h1>
          <p className="text-sm text-gray-400 mt-1">Audit, pay, and schedule your incoming utility obligations.</p>
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
          Add Bill
        </SpecularButton>
      </div>

      {/* Bills display lists */}
      {isLoading ? (
        <SkeletonList count={3} />
      ) : bills.length === 0 ? (
        <EmptyState
          iconName="CalendarClock"
          title="No bills tracked"
          description="Add your rent, water, server host, or electricity bills to prevent interest fee overrides."
          action={
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn-premium btn-premium-primary text-xs py-1.5 px-4 cursor-pointer"
            >
              Add First Bill
            </button>
          }
        />
      ) : (
        <div className="premium-card p-0 overflow-hidden border-black/[0.05] dark:border-white/[0.05]">
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
            {bills.map(bill => {
              const daysLeft = Math.ceil((new Date(bill.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const isOverdue = daysLeft < 0 && !bill.is_paid;

              let badgeColor = 'bg-yellow-500/10 text-yellow-500';
              let statusLabel = 'Pending';
              if (bill.is_paid) {
                badgeColor = 'bg-emerald-500/10 text-emerald-500';
                statusLabel = 'Paid';
              } else if (isOverdue) {
                badgeColor = 'bg-red-500/10 text-red-500';
                statusLabel = 'Overdue';
              }

              return (
                <div key={bill.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleTogglePaid(bill)}
                      className="p-1 rounded-full text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10 cursor-pointer transition-colors"
                      title={bill.is_paid ? 'Mark as Unpaid' : 'Mark as Paid'}
                    >
                      <CheckCircle2 className={`w-6 h-6 ${bill.is_paid ? 'text-emerald-500 fill-emerald-500/10' : 'text-gray-300'}`} />
                    </button>
                    <div>
                      <h4 className="text-sm font-semibold">{bill.name}</h4>
                      <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">
                        Due: {new Date(bill.due_date).toLocaleDateString()} • {bill.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/[0.04] dark:border-white/[0.04]">
                    <div className="text-sm font-bold font-sans">{formatCurrency(Number(bill.amount), user?.baseCurrency)}</div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}>
                        {statusLabel}
                      </span>
                      <button 
                        onClick={() => handleDelete(bill.id, bill.name)}
                        className="p-1 rounded-lg hover:bg-red-500/10 text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bill creation form modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="New Recurring Bill"
      >
        <BillForm 
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={createMutation.isPending}
        />
      </Modal>
    </div>
  );
}
