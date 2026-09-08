import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useToast } from '../components/UI/Toast';
import { Wallet, Transaction } from '../types';
import {
  ArrowLeftRight,
  Plus,
  Search,
  ArrowRight,
  Calendar,
  DollarSign,
  Edit2,
  Trash2,
  X,
  Building2,
  CreditCard as CardIcon,
  Banknote,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function TransfersPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

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
    setFormSourceWallet(wallets[0]?.id || '');
    setFormDestWallet(wallets[1]?.id || '');
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
      default: return <Wallet className="w-4 h-4 text-indigo-500" />;
    }
  };

  // Calculate totals
  const totalVolume = transfers.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-indigo-300" />
            <h1 className="text-2xl font-bold">Account Transfers</h1>
          </div>
          <p className="text-indigo-200 text-sm mt-1">
            Move funds seamlessly between accounts without altering income or expense analytics.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 font-semibold rounded-xl transition shadow-lg shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>New Transfer</span>
        </button>
      </div>

      {/* Bento Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Total Transfers Volume</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-1">Net position remains 100% unchanged</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Transfer Count</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {transfers.length} {transfers.length === 1 ? 'Record' : 'Records'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Atomic debit/credit ledger</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Available Accounts</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {wallets.length} Connected
          </p>
          <p className="text-xs text-gray-400 mt-1">Bank, Cash, Credit Card, Wallets</p>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search transfers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedSourceWallet}
            onChange={(e) => setSelectedSourceWallet(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Source Accounts</option>
            {wallets.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          <select
            value={selectedDestWallet}
            onChange={(e) => setSelectedDestWallet(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Destination Accounts</option>
            {wallets.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transfers List */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Loading transfers...</div>
        ) : transfers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ArrowLeftRight className="w-12 h-12 text-gray-300 dark:text-zinc-700 mx-auto" />
            <h3 className="text-lg font-medium text-gray-800 dark:text-zinc-200">No transfers found</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              You haven't recorded any transfers matching your active filters. Click "New Transfer" to transfer funds between accounts.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-zinc-400 border-b border-gray-100 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-3.5 font-medium">Date</th>
                  <th className="px-6 py-3.5 font-medium">Description</th>
                  <th className="px-6 py-3.5 font-medium">Source Account</th>
                  <th className="px-6 py-3.5 font-medium">Destination Account</th>
                  <th className="px-6 py-3.5 font-medium text-right">Amount</th>
                  <th className="px-6 py-3.5 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/30 transition">
                    <td className="px-6 py-4 text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span>{t.title}</span>
                        <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-800">
                          Transfer
                        </span>
                      </div>
                      {t.notes && (
                        <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{t.notes}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-zinc-300 font-medium">
                        {getWalletIcon()}
                        <span>{t.sourceWalletName || t.wallet_name || 'Source Wallet'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-zinc-300 font-medium">
                        {getWalletIcon()}
                        <span>{t.destinationWalletName || t.destination_wallet_name || 'Destination Wallet'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white whitespace-nowrap">
                      ${Number(t.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(t)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
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
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
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
        )}
      </div>

      {/* New / Edit Transfer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {editingTransfer ? 'Edit Transfer' : 'Record New Transfer'}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Transfer Amount ($)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-lg font-bold bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Source & Destination Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    From (Source Account)
                  </label>
                  <select
                    required
                    value={formSourceWallet}
                    onChange={(e) => setFormSourceWallet(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" disabled>Select Source</option>
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} (${Number(w.balance).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    To (Destination Account)
                  </label>
                  <select
                    required
                    value={formDestWallet}
                    onChange={(e) => setFormDestWallet(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" disabled>Select Destination</option>
                    {wallets
                      .filter(w => w.id !== formSourceWallet)
                      .map(w => (
                        <option key={w.id} value={w.id}>
                          {w.name} (${Number(w.balance).toFixed(2)})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Title / Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Reference / Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ATM Cash Withdrawal, Card Payment"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Transfer Date
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Notes / Memo (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional transfer details..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Processing...' : (editingTransfer ? 'Save Changes' : 'Confirm Transfer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
