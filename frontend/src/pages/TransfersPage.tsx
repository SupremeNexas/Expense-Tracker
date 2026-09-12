import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useToast } from '../components/UI/Toast';
import useAuthStore from '../store/authStore';
import { formatCurrency, SUPPORTED_CURRENCIES } from '../utils/currency';
import Modal from '../components/UI/Modal';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Button from '../components/UI/Button';
import EmptyState from '../components/UI/EmptyState';
import { SkeletonList } from '../components/UI/Skeleton';
import SpecularButton from '../components/UI/SpecularButton';
import type { Wallet, Transaction } from '../types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Building2,
  CreditCard as CardIcon,
  Banknote,
  Wallet as WalletIcon,
  AlertCircle
} from 'lucide-react';

export default function TransfersPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const currencySymbol = SUPPORTED_CURRENCIES.find(c => c.code === (user?.baseCurrency || 'INR'))?.symbol || '₹';

  const [search, setSearch] = useState('');
  const [selectedSourceWallet, setSelectedSourceWallet] = useState('');
  const [selectedDestWallet, setSelectedDestWallet] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<Transaction | null>(null);

  // Form state
  const [formAmount, setFormAmount] = useState('');
  const [formSourceWallet, setFormSourceWallet] = useState('');
  const [formDestWallet, setFormDestWallet] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().substring(0, 10));
  const [formError, setFormError] = useState('');

  // Fetch wallets
  const { data: wallets = [] } = useQuery<Wallet[]>({
    queryKey: ['wallets'],
    queryFn: () => api.request('/expenses/wallets')
  });

  // Fetch transfers
  const { data: transfersData, isLoading } = useQuery({
    queryKey: ['transfers', search, selectedSourceWallet, selectedDestWallet],
    queryFn: () => api.getTransfers({
      search: search || undefined,
      wallet_id: selectedSourceWallet || undefined,
      to_wallet_id: selectedDestWallet || undefined,
    })
  });

  const transfers: Transaction[] = Array.isArray(transfersData)
    ? transfersData
    : transfersData?.data || [];

  // Create Transfer Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createTransfer(data),
    onSuccess: () => {
      showToast('Transfer completed successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create transfer');
    }
  });

  // Update Transfer Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateTransfer(id, data),
    onSuccess: () => {
      showToast('Transfer updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update transfer');
    }
  });

  // Delete Transfer Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTransfer(id),
    onSuccess: () => {
      showToast('Transfer deleted and balances restored', 'success');
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to delete transfer', 'error');
    }
  });

  const openCreateModal = () => {
    setEditingTransfer(null);
    setFormAmount('');
    const sourceId = wallets[0]?.id || '';
    const destId = wallets.find(w => w.id !== sourceId)?.id || '';
    setFormSourceWallet(sourceId);
    setFormDestWallet(destId);
    setFormTitle('');
    setFormNotes('');
    setFormDate(new Date().toISOString().substring(0, 10));
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: Transaction) => {
    setEditingTransfer(t);
    setFormAmount(String(t.amount));
    setFormSourceWallet(t.wallet_id || t.walletId || '');
    setFormDestWallet(t.to_wallet_id || t.toWalletId || '');
    setFormTitle(t.title || '');
    setFormNotes(t.notes || '');
    setFormDate(t.date ? new Date(t.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10));
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTransfer(null);
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const numAmount = parseFloat(formAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid positive transfer amount');
      return;
    }

    if (!formSourceWallet) {
      setFormError('Please select a source account');
      return;
    }

    if (!formDestWallet) {
      setFormError('Please select a destination account');
      return;
    }

    if (formSourceWallet === formDestWallet) {
      setFormError('Source and destination accounts must be different');
      return;
    }

    const payload = {
      amount: numAmount,
      wallet_id: formSourceWallet,
      to_wallet_id: formDestWallet,
      title: formTitle.trim() || undefined,
      notes: formNotes.trim() || undefined,
      date: formDate
    };

    if (editingTransfer) {
      updateMutation.mutate({ id: editingTransfer.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getWalletIcon = (type?: string) => {
    switch (type) {
      case 'BANK': return <Building2 className="w-4 h-4 text-blue-500" />;
      case 'CREDIT_CARD': return <CardIcon className="w-4 h-4 text-pink-500" />;
      case 'CASH': return <Banknote className="w-4 h-4 text-emerald-500" />;
      default: return <WalletIcon className="w-4 h-4 text-indigo-500" />;
    }
  };

  // Calculate totals
  const totalVolume = transfers.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  return (
    <div className="space-y-6 fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-black/[0.04] dark:border-white/[0.04] gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Transfers</h1>
          <p className="text-sm text-gray-400 mt-1">
            Move funds seamlessly between accounts without altering income or expense analytics.
          </p>
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
          onClick={openCreateModal}
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Add Transfer
        </SpecularButton>
      </div>

      {/* Bento Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Transfers Volume</div>
          <div className="text-3xl font-bold mt-2 font-sans">{formatCurrency(totalVolume, user?.baseCurrency)}</div>
          <span className="text-[10px] text-gray-400 font-medium mt-1 inline-block">Net position remains 100% unchanged</span>
        </div>

        <div className="premium-card">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Transfer Count</div>
          <div className="text-3xl font-bold mt-2 font-sans">{transfers.length} {transfers.length === 1 ? 'Record' : 'Records'}</div>
          <span className="text-[10px] text-gray-400 font-medium mt-1 inline-block">Atomic debit/credit ledger</span>
        </div>

        <div className="premium-card">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Available Accounts</div>
          <div className="text-3xl font-bold mt-2 font-sans">{wallets.length} Connected</div>
          <span className="text-[10px] text-gray-400 font-medium mt-1 inline-block">Bank, Cash, Credit Card, Wallets</span>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="premium-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between border-black/[0.05] dark:border-white/[0.05]">
        <div className="relative w-full md:w-80 flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transfers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-premium pl-9 pr-4 py-2 text-xs w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedSourceWallet}
            onChange={(e) => setSelectedSourceWallet(e.target.value)}
            className="input-premium py-1.5 px-3 text-xs cursor-pointer min-w-[150px]"
          >
            <option value="">All Source Accounts</option>
            {wallets.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          <select
            value={selectedDestWallet}
            onChange={(e) => setSelectedDestWallet(e.target.value)}
            className="input-premium py-1.5 px-3 text-xs cursor-pointer min-w-[150px]"
          >
            <option value="">All Destination Accounts</option>
            {wallets.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transfers List */}
      {isLoading ? (
        <SkeletonList count={3} />
      ) : transfers.length === 0 ? (
        <EmptyState
          iconName="ArrowLeftRight"
          title="No transfers found"
          description="You haven't recorded any transfers matching your active filters. Click 'Add Transfer' to transfer funds between accounts."
          action={
            <button
              onClick={openCreateModal}
              className="btn-premium btn-premium-primary text-xs py-1.5 px-4 cursor-pointer"
            >
              Add First Transfer
            </button>
          }
        />
      ) : (
        <div className="premium-card p-0 overflow-hidden border-black/[0.05] dark:border-white/[0.05]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-black/[0.04] dark:border-white/[0.04] text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="p-4 pl-6">Date</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Source Account</th>
                  <th className="p-4">Destination Account</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                {transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 pl-6 text-gray-400 whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold flex items-center gap-2">
                        <span>{t.title || 'Account Transfer'}</span>
                        <span className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider bg-indigo-500/10 text-indigo-500 rounded-full">
                          Transfer
                        </span>
                      </div>
                      {t.notes && (
                        <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{t.notes}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-medium">
                        {getWalletIcon(wallets.find(w => w.id === (t.wallet_id || t.walletId))?.type)}
                        <span>{t.sourceWalletName || t.wallet_name || 'Source Wallet'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-medium">
                        {getWalletIcon(wallets.find(w => w.id === (t.to_wallet_id || t.toWalletId))?.type)}
                        <span>{t.destinationWalletName || t.destination_wallet_name || 'Destination Wallet'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold font-sans whitespace-nowrap">
                      {formatCurrency(Number(t.amount), user?.baseCurrency)}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(t)}
                          className="p-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-gray-400 hover:text-black dark:hover:text-white cursor-pointer transition-colors"
                          title="Edit Transfer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this transfer? Source and destination balances will be restored.')) {
                              deleteMutation.mutate(t.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 cursor-pointer transition-colors"
                          title="Delete Transfer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New / Edit Transfer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTransfer ? 'Edit Transfer' : 'Record New Transfer'}
        description="Move funds between source and destination accounts."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Amount */}
          <Input
            label={`Transfer Amount (${currencySymbol})`}
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            value={formAmount}
            onChange={(e) => setFormAmount(e.target.value)}
            icon={<span className="text-sm font-semibold text-gray-400 dark:text-gray-500">{currencySymbol}</span>}
          />

          {/* Source & Destination Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Select
              label="From (Source Account)"
              required
              value={formSourceWallet}
              onChange={(e) => {
                const selectedSource = e.target.value;
                setFormSourceWallet(selectedSource);
                if (formDestWallet === selectedSource) {
                  const nextDest = wallets.find(w => w.id !== selectedSource)?.id || '';
                  setFormDestWallet(nextDest);
                }
              }}
            >
              <option value="" disabled>Select Source</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({formatCurrency(Number(w.balance), user?.baseCurrency)})
                </option>
              ))}
            </Select>

            <Select
              label="To (Destination Account)"
              required
              value={formDestWallet}
              onChange={(e) => setFormDestWallet(e.target.value)}
            >
              <option value="" disabled>Select Destination</option>
              {wallets
                .filter(w => w.id !== formSourceWallet)
                .map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatCurrency(Number(w.balance), user?.baseCurrency)})
                  </option>
                ))}
            </Select>
          </div>

          {/* Title / Description */}
          <Input
            label="Reference / Description (Optional)"
            type="text"
            placeholder="e.g. ATM Cash Withdrawal, Card Payment"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
          />

          {/* Date */}
          <Input
            label="Transfer Date"
            type="date"
            required
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
          />

          {/* Notes */}
          <div className="flex flex-col text-left">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5 font-sans">
              Notes / Memo (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Additional transfer details..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full p-4 min-h-[80px] rounded-[14px] bg-black/[0.02] dark:bg-white/[0.02] border border-border text-sm outline-none transition-all duration-200 resize-none hover:border-black/[0.12] dark:hover:border-white/[0.12] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-sans"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500/20"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Processing...' : (editingTransfer ? 'Save Changes' : 'Confirm Transfer')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
