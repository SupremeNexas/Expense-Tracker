import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp, Plus, Search, Calendar, DollarSign, Wallet as WalletIcon,
  Tag, CreditCard, Edit, Trash2, CheckCircle2, Clock, RotateCw, Filter,
  ArrowUpRight, ArrowDownRight, Layers, Sparkles
} from 'lucide-react';
import { api } from '../api/client';
import useAuthStore from '../store/authStore';
import { formatCurrency } from '../utils/currency';
import { useToast } from '../components/UI/Toast';
import { Modal } from '../components/UI/Modal';
import { Input } from '../components/UI/Input';
import { Select } from '../components/UI/Select';
import { Button } from '../components/UI/Button';
import { Transaction, Category, Wallet, RecurringTransaction } from '../types';

export default function IncomePage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'income' | 'recurring'>('income');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>(String(new Date().getMonth() + 1));
  const [yearFilter, setYearFilter] = useState<string>(String(new Date().getFullYear()));

  // Modals
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<any>(null);

  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<any>(null);

  // Income Form State
  const [incomeForm, setIncomeForm] = useState({
    title: '',
    amount: '',
    category_id: '',
    wallet_id: '',
    payment_method: 'Bank Transfer',
    date: new Date().toISOString().substring(0, 10),
    tags: '',
    notes: '',
  });

  // Recurring Income Form State
  const [recurringForm, setRecurringForm] = useState({
    title: '',
    amount: '',
    category_id: '',
    wallet_id: '',
    frequency: 'MONTHLY',
    startDate: new Date().toISOString().substring(0, 10),
    nextDate: new Date().toISOString().substring(0, 10),
    endDate: '',
  });

  // Queries
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories-income'],
    queryFn: () => api.getCategories()
  });

  const incomeCategories = categories.filter(c => c.type === 'INCOME');

  const { data: wallets = [] } = useQuery<Wallet[]>({
    queryKey: ['wallets'],
    queryFn: () => api.request('/expenses/wallets')
  });

  const { data: transactionsData, isLoading: txLoading } = useQuery({
    queryKey: ['incomes', search, selectedCategory, selectedWallet, monthFilter, yearFilter],
    queryFn: () => api.getExpenses({
      type: 'INCOME',
      search: search || undefined,
      category_id: selectedCategory || undefined,
      wallet_id: selectedWallet || undefined,
      month: monthFilter || undefined,
      year: yearFilter || undefined,
    })
  });

  const incomes: Transaction[] = Array.isArray(transactionsData)
    ? transactionsData
    : (transactionsData?.data || []);

  const { data: recurringIncomes = [], isLoading: recLoading } = useQuery<RecurringTransaction[]>({
    queryKey: ['recurring-incomes'],
    queryFn: () => api.getRecurring({ type: 'INCOME' })
  });

  const { data: summary } = useQuery({
    queryKey: ['summary', monthFilter, yearFilter],
    queryFn: () => api.getSummary({ month: monthFilter, year: yearFilter })
  });

  // Mutations
  const createIncomeMutation = useMutation({
    mutationFn: (data: any) => api.createExpense({ ...data, type: 'INCOME' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['trend'] });
      showToast('Income recorded successfully!', 'success');
      setIsIncomeModalOpen(false);
      resetIncomeForm();
    },
    onError: (err: any) => showToast(err.message || 'Failed to create income', 'error')
  });

  const updateIncomeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateExpense(id, { ...data, type: 'INCOME' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['trend'] });
      showToast('Income updated successfully!', 'success');
      setIsIncomeModalOpen(false);
      resetIncomeForm();
    },
    onError: (err: any) => showToast(err.message || 'Failed to update income', 'error')
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: (id: string) => api.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['trend'] });
      showToast('Income deleted successfully!', 'info');
    },
    onError: (err: any) => showToast(err.message || 'Failed to delete income', 'error')
  });

  const createRecurringMutation = useMutation({
    mutationFn: (data: any) => api.createRecurring({ ...data, type: 'INCOME' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-incomes'] });
      showToast('Recurring income schedule created!', 'success');
      setIsRecurringModalOpen(false);
      resetRecurringForm();
    },
    onError: (err: any) => showToast(err.message || 'Failed to create recurring income', 'error')
  });

  const updateRecurringMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateRecurring(id, { ...data, type: 'INCOME' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-incomes'] });
      showToast('Recurring income schedule updated!', 'success');
      setIsRecurringModalOpen(false);
      resetRecurringForm();
    },
    onError: (err: any) => showToast(err.message || 'Failed to update recurring income', 'error')
  });

  const deleteRecurringMutation = useMutation({
    mutationFn: (id: string) => api.deleteRecurring(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-incomes'] });
      showToast('Recurring income rule removed', 'info');
    },
    onError: (err: any) => showToast(err.message || 'Failed to delete recurring income', 'error')
  });

  const processRecurringMutation = useMutation({
    mutationFn: (id: string) => api.processRecurring(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-incomes'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      showToast('Occurrence logged and wallet updated!', 'success');
    },
    onError: (err: any) => showToast(err.message || 'Failed to process recurring income', 'error')
  });

  const resetIncomeForm = () => {
    setEditingIncome(null);
    setIncomeForm({
      title: '',
      amount: '',
      category_id: incomeCategories[0]?.id || categories[0]?.id || '',
      wallet_id: wallets[0]?.id || '',
      payment_method: 'Bank Transfer',
      date: new Date().toISOString().substring(0, 10),
      tags: '',
      notes: '',
    });
  };

  const resetRecurringForm = () => {
    setEditingRecurring(null);
    setRecurringForm({
      title: '',
      amount: '',
      category_id: incomeCategories[0]?.id || categories[0]?.id || '',
      wallet_id: wallets[0]?.id || '',
      frequency: 'MONTHLY',
      startDate: new Date().toISOString().substring(0, 10),
      nextDate: new Date().toISOString().substring(0, 10),
      endDate: '',
    });
  };

  const handleOpenAddIncome = () => {
    resetIncomeForm();
    setIncomeForm(prev => ({
      ...prev,
      category_id: incomeCategories[0]?.id || categories[0]?.id || '',
      wallet_id: wallets[0]?.id || ''
    }));
    setIsIncomeModalOpen(true);
  };

  const handleOpenEditIncome = (inc: Transaction) => {
    setEditingIncome(inc);
    setIncomeForm({
      title: inc.title,
      amount: String(inc.amount),
      category_id: inc.categoryId || inc.category_id || '',
      wallet_id: inc.walletId || inc.wallet_id || '',
      payment_method: inc.paymentMethod || inc.payment_method || 'Bank Transfer',
      date: inc.date ? new Date(inc.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
      tags: Array.isArray(inc.tags) ? inc.tags.join(', ') : '',
      notes: inc.notes || '',
    });
    setIsIncomeModalOpen(true);
  };

  const handleIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeForm.title || !incomeForm.amount || !incomeForm.category_id || !incomeForm.wallet_id) {
      showToast('Please fill out all required fields', 'warning');
      return;
    }

    const payload = {
      title: incomeForm.title,
      amount: parseFloat(incomeForm.amount),
      category_id: incomeForm.category_id,
      wallet_id: incomeForm.wallet_id,
      payment_method: incomeForm.payment_method,
      date: new Date(incomeForm.date).toISOString(),
      tags: incomeForm.tags ? incomeForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      notes: incomeForm.notes,
      type: 'INCOME',
    };

    if (editingIncome) {
      updateIncomeMutation.mutate({ id: editingIncome.id, data: payload });
    } else {
      createIncomeMutation.mutate(payload);
    }
  };

  const handleOpenAddRecurring = () => {
    resetRecurringForm();
    setRecurringForm(prev => ({
      ...prev,
      category_id: incomeCategories[0]?.id || categories[0]?.id || '',
      wallet_id: wallets[0]?.id || ''
    }));
    setIsRecurringModalOpen(true);
  };

  const handleOpenEditRecurring = (rec: RecurringTransaction) => {
    setEditingRecurring(rec);
    setRecurringForm({
      title: rec.title,
      amount: String(rec.amount),
      category_id: rec.category_id,
      wallet_id: rec.wallet_id,
      frequency: rec.frequency,
      startDate: new Date(rec.startDate).toISOString().substring(0, 10),
      nextDate: new Date(rec.nextDate).toISOString().substring(0, 10),
      endDate: rec.endDate ? new Date(rec.endDate).toISOString().substring(0, 10) : '',
    });
    setIsRecurringModalOpen(true);
  };

  const handleRecurringSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recurringForm.title || !recurringForm.amount || !recurringForm.category_id || !recurringForm.wallet_id) {
      showToast('Please fill out all required fields', 'warning');
      return;
    }

    const payload = {
      title: recurringForm.title,
      amount: parseFloat(recurringForm.amount),
      category_id: recurringForm.category_id,
      wallet_id: recurringForm.wallet_id,
      frequency: recurringForm.frequency,
      startDate: new Date(recurringForm.startDate).toISOString(),
      nextDate: new Date(recurringForm.nextDate).toISOString(),
      endDate: recurringForm.endDate ? new Date(recurringForm.endDate).toISOString() : null,
      type: 'INCOME',
    };

    if (editingRecurring) {
      updateRecurringMutation.mutate({ id: editingRecurring.id, data: payload });
    } else {
      createRecurringMutation.mutate(payload);
    }
  };

  // Metrics
  const totalMonthlyIncome = summary?.totalIncome || incomes.reduce((sum, inc) => sum + Number(inc.amount), 0);
  const recurringMonthlyVolume = recurringIncomes
    .filter(r => r.isActive)
    .reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="space-y-8 pb-10 min-h-screen text-[#0b1c30] p-6 -m-6 pt-20">
      {/* Background overlay */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="https://raft-blast-61784561.figma.site/_assets/v11/16b5007d9c93971e26ffe4e0e3e37946f6bd538c.png"
          alt=""
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-white/10 backdrop-brightness-110" />
      </div>

      <div className="relative z-10 space-y-8 p-4 md:p-8">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 pb-6 border-b border-[#e5eeff]">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-[#0b1c30] bg-white/40 px-2.5 py-1 mb-2 inline-block border border-[#e5eeff] rounded-[6px] backdrop-blur-md">
              CASH INFLOWS
            </div>
            <h1
              className="text-4xl md:text-5xl font-normal tracking-wide font-serif uppercase leading-none text-[#0b1c30] mb-2"
              style={{ fontFamily: "'Ogg Medium', Georgia, serif" }}
            >
              INCOME TRACKING
            </h1>
            <p className="text-sm text-[#0b1c30]/70">Track salary, freelance, interest, refunds, and recurring retainers</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleOpenAddRecurring}
              variant="secondary"
              className="bg-[#fdf1e1] text-[#111411] hover:bg-[#f5e4cd] border border-[rgba(253,241,225,0.6)] font-semibold shadow-md"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              + RECURRING RULE
            </Button>

            <Button
              onClick={handleOpenAddIncome}
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              + LOG INCOME
            </Button>
          </div>
        </div>

        {/* Bento Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#fdf1e1] text-[#111411] rounded-2xl p-6 border border-[rgba(253,241,225,0.42)] shadow-xl shadow-black/20">
            <div className="flex items-center gap-2 text-[#111411]/60 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Monthly Income</span>
            </div>
            <div
              className="text-3xl lg:text-4xl font-normal font-serif text-[#111411]"
              style={{ fontFamily: "'Ogg Medium', Georgia, serif" }}
            >
              {formatCurrency(totalMonthlyIncome, user?.baseCurrency)}
            </div>
            <div className="text-[10px] text-[#111411]/60 mt-1 font-semibold">Confirmed cash inflows for selected period</div>
          </div>

          <div className="bg-[#fdf1e1] text-[#111411] rounded-2xl p-6 border border-[rgba(253,241,225,0.42)] shadow-xl shadow-black/20">
            <div className="flex items-center gap-2 text-[#111411]/60 mb-2">
              <RotateCw className="w-4 h-4 text-blue-600" strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Recurring Volume</span>
            </div>
            <div
              className="text-3xl lg:text-4xl font-normal font-serif text-[#111411]"
              style={{ fontFamily: "'Ogg Medium', Georgia, serif" }}
            >
              {formatCurrency(recurringMonthlyVolume, user?.baseCurrency)}
            </div>
            <div className="text-[10px] text-[#111411]/60 mt-1 font-semibold">{recurringIncomes.filter(r => r.isActive).length} active recurring rules</div>
          </div>

          <div className="bg-[#fdf1e1] text-[#111411] rounded-2xl p-6 border border-[rgba(253,241,225,0.42)] shadow-xl shadow-black/20">
            <div className="flex items-center gap-2 text-[#111411]/60 mb-2">
              <Tag className="w-4 h-4 text-purple-600" strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Top Source</span>
            </div>
            <div
              className="text-2xl lg:text-3xl font-normal font-serif text-[#111411] truncate"
              style={{ fontFamily: "'Ogg Medium', Georgia, serif" }}
            >
              {summary?.highestIncome?.category_name || 'Salary'}
            </div>
            <div className="text-[10px] text-[#111411]/60 mt-1 font-semibold">Primary revenue category</div>
          </div>

          <div className="bg-[#fdf1e1] text-[#111411] rounded-2xl p-6 border border-[rgba(253,241,225,0.42)] shadow-xl shadow-black/20">
            <div className="flex items-center gap-2 text-[#111411]/60 mb-2">
              <Layers className="w-4 h-4 text-amber-600" strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Net Cash Flow</span>
            </div>
            <div
              className="text-3xl lg:text-4xl font-normal font-serif text-[#111411]"
              style={{ fontFamily: "'Ogg Medium', Georgia, serif" }}
            >
              {formatCurrency(summary?.net || (totalMonthlyIncome - (summary?.total || 0)), user?.baseCurrency)}
            </div>
            <div className="text-[10px] text-[#111411]/60 mt-1 font-semibold">Income minus expense outflows</div>
          </div>
        </div>

        {/* Tab Navigation & Search Filters */}
        <div className="bg-[#fdf1e1] text-[#111411] rounded-2xl p-6 border border-[rgba(253,241,225,0.42)] shadow-xl shadow-black/20 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#111411]/10">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-[#111411]/5 rounded-xl border border-[#111411]/10">
              <button
                onClick={() => setActiveTab('income')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'income'
                    ? 'bg-[#111411] text-[#fdf1e1] shadow-md'
                    : 'text-[#111411]/70 hover:text-[#111411]'
                }`}
              >
                Income Transactions ({incomes.length})
              </button>
              <button
                onClick={() => setActiveTab('recurring')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'recurring'
                    ? 'bg-[#111411] text-[#fdf1e1] shadow-md'
                    : 'text-[#111411]/70 hover:text-[#111411]'
                }`}
              >
                Recurring Rules ({recurringIncomes.length})
              </button>
            </div>

            {/* Filter Bar */}
            {activeTab === 'income' && (
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-56">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search source or notes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#111411]/5 border border-[#111411]/10 outline-none focus:border-emerald-500 font-sans"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-[#111411]/5 border border-[#111411]/10 outline-none focus:border-emerald-500 font-sans"
                >
                  <option value="">All Income Categories</option>
                  {incomeCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>

                <select
                  value={selectedWallet}
                  onChange={(e) => setSelectedWallet(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-[#111411]/5 border border-[#111411]/10 outline-none focus:border-emerald-500 font-sans"
                >
                  <option value="">All Wallets</option>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* TAB 1: INCOME TRANSACTIONS */}
          {activeTab === 'income' && (
            <div className="space-y-4">
              {txLoading ? (
                <div className="py-12 text-center text-sm font-semibold text-gray-500">Loading income ledger...</div>
              ) : incomes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#111411]">
                    <thead className="border-b border-[#111411]/10 text-[10px] font-bold uppercase tracking-wider text-[#111411]/60 bg-[#111411]/5">
                      <tr>
                        <th className="py-3 px-4">Title / Source</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Wallet</th>
                        <th className="py-3 px-4">Payment Method</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#111411]/5">
                      {incomes.map((inc) => (
                        <tr key={inc.id} className="hover:bg-[#111411]/5 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-sm text-[#111411]">{inc.title}</div>
                            {inc.notes && <div className="text-[10px] text-gray-500 truncate max-w-xs">{inc.notes}</div>}
                            {inc.tags && inc.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {inc.tags.map((t, idx) => (
                                  <span key={idx} className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-semibold">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-800 text-[11px]">
                              {inc.category_name || 'Income'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-700">{inc.wallet_name || 'Main Account'}</td>
                          <td className="py-3 px-4 text-gray-600">{inc.payment_method || 'Bank Transfer'}</td>
                          <td className="py-3 px-4 text-gray-600">{new Date(inc.date).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-right font-extrabold text-sm text-emerald-700">
                            +{formatCurrency(inc.amount, user?.baseCurrency)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenEditIncome(inc)}
                                className="p-1.5 rounded-lg hover:bg-black/10 text-gray-700"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteIncomeMutation.mutate(inc.id)}
                                className="p-1.5 rounded-lg hover:bg-red-100 text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 bg-[#111411]/5 rounded-xl border border-[#111411]/10">
                  <TrendingUp className="w-10 h-10 mx-auto text-emerald-600 mb-3 opacity-60" />
                  <h3 className="text-sm font-bold text-[#111411] mb-1">No income entries found</h3>
                  <p className="text-xs text-gray-500 mb-4">Start logging your salary, freelance retainers, or investment returns.</p>
                  <Button onClick={handleOpenAddIncome} variant="primary" className="bg-emerald-600 text-white">
                    + Add Income
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RECURRING RULES */}
          {activeTab === 'recurring' && (
            <div className="space-y-4">
              {recLoading ? (
                <div className="py-12 text-center text-sm font-semibold text-gray-500">Loading recurring income rules...</div>
              ) : recurringIncomes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recurringIncomes.map((rec) => (
                    <div key={rec.id} className="p-4 rounded-xl bg-[#111411]/5 border border-[#111411]/10 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                              {rec.frequency} RECURRING
                            </span>
                            <h4 className="text-base font-bold text-[#111411] mt-1">{rec.title}</h4>
                          </div>
                          <span className="text-base font-extrabold text-emerald-700">
                            +{formatCurrency(rec.amount, user?.baseCurrency)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-600 font-medium">
                          <div><span className="text-gray-400">Category:</span> {rec.category_name}</div>
                          <div><span className="text-gray-400">Wallet:</span> {rec.wallet_name}</div>
                          <div><span className="text-gray-400">Next Date:</span> {new Date(rec.nextDate).toLocaleDateString()}</div>
                          <div><span className="text-gray-400">Status:</span> {rec.isActive ? 'Active' : 'Inactive'}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#111411]/10">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => processRecurringMutation.mutate(rec.id)}
                          className="text-[11px] bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Process Now
                        </Button>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenEditRecurring(rec)}
                            className="p-1.5 rounded-lg hover:bg-black/10 text-gray-700"
                            title="Edit Rule"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteRecurringMutation.mutate(rec.id)}
                            className="p-1.5 rounded-lg hover:bg-red-100 text-red-600"
                            title="Delete Rule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-[#111411]/5 rounded-xl border border-[#111411]/10">
                  <RotateCw className="w-10 h-10 mx-auto text-blue-600 mb-3 opacity-60" />
                  <h3 className="text-sm font-bold text-[#111411] mb-1">No recurring income rules</h3>
                  <p className="text-xs text-gray-500 mb-4">Set up automated recurring rules for monthly salary, client retainers, or dividends.</p>
                  <Button onClick={handleOpenAddRecurring} variant="primary" className="bg-blue-600 text-white">
                    + Set Recurring Rule
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD/EDIT INCOME TRANSACTION */}
      <Modal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        title={editingIncome ? 'Edit Income Entry' : 'Log New Income'}
      >
        <form onSubmit={handleIncomeSubmit} className="space-y-4 pt-2">
          <Input
            label="Title / Source"
            type="text"
            placeholder="e.g. Monthly Salary, Upwork Project"
            value={incomeForm.title}
            onChange={(e) => setIncomeForm({ ...incomeForm, title: e.target.value })}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={incomeForm.amount}
              onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
              required
            />

            <Select
              label="Category"
              value={incomeForm.category_id}
              onChange={(e) => setIncomeForm({ ...incomeForm, category_id: e.target.value })}
              required
            >
              <option value="" disabled>Select income category</option>
              {incomeCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Deposit Wallet / Account"
              value={incomeForm.wallet_id}
              onChange={(e) => setIncomeForm({ ...incomeForm, wallet_id: e.target.value })}
              required
            >
              <option value="" disabled>Select destination wallet</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({formatCurrency(Number(w.balance), user?.baseCurrency)})</option>
              ))}
            </Select>

            <Select
              label="Payment Method"
              value={incomeForm.payment_method}
              onChange={(e) => setIncomeForm({ ...incomeForm, payment_method: e.target.value })}
            >
              <option value="Bank Transfer">Bank Transfer / Direct Deposit</option>
              <option value="UPI">UPI / Digital Wallet</option>
              <option value="Cash">Cash</option>
              <option value="Check">Check</option>
              <option value="Wire">Wire Transfer</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={incomeForm.date}
              onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
              required
            />

            <Input
              label="Tags (comma separated)"
              type="text"
              placeholder="e.g. salary, bonus, freelance"
              value={incomeForm.tags}
              onChange={(e) => setIncomeForm({ ...incomeForm, tags: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">Notes</label>
            <textarea
              value={incomeForm.notes}
              onChange={(e) => setIncomeForm({ ...incomeForm, notes: e.target.value })}
              placeholder="Add optional notes or description..."
              className="w-full p-3 rounded-xl border border-gray-300 text-xs outline-none focus:border-emerald-500 min-h-[80px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={() => setIsIncomeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-emerald-600 text-white">
              {editingIncome ? 'Update Income' : 'Save Income'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ADD/EDIT RECURRING RULE */}
      <Modal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        title={editingRecurring ? 'Edit Recurring Rule' : 'New Recurring Income Rule'}
      >
        <form onSubmit={handleRecurringSubmit} className="space-y-4 pt-2">
          <Input
            label="Title / Source"
            type="text"
            placeholder="e.g. Monthly Salary Retainer"
            value={recurringForm.title}
            onChange={(e) => setRecurringForm({ ...recurringForm, title: e.target.value })}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={recurringForm.amount}
              onChange={(e) => setRecurringForm({ ...recurringForm, amount: e.target.value })}
              required
            />

            <Select
              label="Frequency"
              value={recurringForm.frequency}
              onChange={(e) => setRecurringForm({ ...recurringForm, frequency: e.target.value })}
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={recurringForm.category_id}
              onChange={(e) => setRecurringForm({ ...recurringForm, category_id: e.target.value })}
              required
            >
              <option value="" disabled>Select category</option>
              {incomeCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>

            <Select
              label="Deposit Wallet"
              value={recurringForm.wallet_id}
              onChange={(e) => setRecurringForm({ ...recurringForm, wallet_id: e.target.value })}
              required
            >
              <option value="" disabled>Select destination wallet</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={recurringForm.startDate}
              onChange={(e) => setRecurringForm({ ...recurringForm, startDate: e.target.value })}
              required
            />

            <Input
              label="Next Occurrence"
              type="date"
              value={recurringForm.nextDate}
              onChange={(e) => setRecurringForm({ ...recurringForm, nextDate: e.target.value })}
              required
            />
          </div>

          <Input
            label="Optional End Date"
            type="date"
            value={recurringForm.endDate}
            onChange={(e) => setRecurringForm({ ...recurringForm, endDate: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={() => setIsRecurringModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-blue-600 text-white">
              {editingRecurring ? 'Update Rule' : 'Save Rule'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
