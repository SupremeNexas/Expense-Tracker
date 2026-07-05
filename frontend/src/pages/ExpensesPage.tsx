import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Filter, Search, Receipt } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/UI/Toast';
import ExpenseList from '../components/Expenses/ExpenseList';
import ExpenseForm from '../components/Expenses/ExpenseForm';
import Modal from '../components/UI/Modal';
import { Category, Transaction } from '../types';

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Transaction | null>(null);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Queries
  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Transaction[]>({
    queryKey: ['expenses'],
    queryFn: () => api.getExpenses()
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.getCategories()
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createExpense(data),
    onSuccess: () => {
      showToast('Transaction added successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['trend'] });
      queryClient.invalidateQueries({ queryKey: ['categories-pie'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to add transaction', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateExpense(id, data),
    onSuccess: () => {
      showToast('Transaction updated successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['trend'] });
      queryClient.invalidateQueries({ queryKey: ['categories-pie'] });
      setIsModalOpen(false);
      setEditingExpense(null);
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to update transaction', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteExpense(id),
    onSuccess: () => {
      showToast('Transaction deleted successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['trend'] });
      queryClient.invalidateQueries({ queryKey: ['categories-pie'] });
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to delete transaction', 'error');
    }
  });

  // Filter local items
  const filteredExpenses = expenses.filter(exp => {
    let matches = true;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatches = exp.title.toLowerCase().includes(q);
      const notesMatches = exp.notes?.toLowerCase().includes(q) || false;
      const tagMatches = exp.tags?.some(tag => tag.toLowerCase().includes(q)) || false;
      matches = matches && (titleMatches || notesMatches || tagMatches);
    }

    // Category
    if (filterCategory) {
      matches = matches && (exp.category_id || exp.categoryId) === filterCategory;
    }

    // Month
    if (filterMonth) {
      const expMonth = new Date(exp.date).toISOString().substring(0, 7); // YYYY-MM
      matches = matches && expMonth === filterMonth;
    }

    return matches;
  });

  const handleOpenModal = (expense: Transaction | null = null) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingExpense(null);
    setIsModalOpen(false);
  };

  const handleSubmit = (data: any) => {
    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (expense: Transaction) => {
    if (window.confirm(`Are you sure you want to delete "${expense.title}"?`)) {
      deleteMutation.mutate(expense.id);
    }
  };

  return (
    <div className="space-y-6 fade-in-up">
      {/* Page Header */}
      <div className="flex justify-between items-center pb-4 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ledger Transactions</h1>
          <p className="text-sm text-gray-400 mt-1">Review, search, and audit your transaction history.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn-premium btn-premium-primary gap-2 cursor-pointer py-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Transaction
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="premium-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between border-black/[0.05] dark:border-white/[0.05]">
        {/* Search */}
        <div className="relative w-full md:w-80 flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, tag, or note..." 
            className="input-premium pl-9 py-2 text-xs w-full"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select 
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="input-premium py-1.5 px-3 text-xs cursor-pointer w-36"
          >
            <option value="">All Time</option>
            <option value={new Date().toISOString().substring(0, 7)}>This Month</option>
          </select>

          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-premium py-1.5 px-3 text-xs cursor-pointer w-40"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {(filterMonth || filterCategory || searchQuery) && (
            <button 
              onClick={() => { setFilterMonth(''); setFilterCategory(''); setSearchQuery(''); }}
              className="text-xs font-semibold text-gray-500 hover:text-black dark:hover:text-white cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Transactions list */}
      <ExpenseList 
        expenses={filteredExpenses} 
        loading={expensesLoading} 
        onEdit={handleOpenModal}
        onDelete={handleDelete}
      />

      {/* Edit/Create Dialog Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title={editingExpense ? 'Modify Transaction' : 'New Transaction'}
        description={editingExpense ? 'Update the details of this transaction.' : 'Record an expense or income.'}
        maxWidth="720px"
      >
        <ExpenseForm 
          initialData={editingExpense} 
          onSubmit={handleSubmit} 
          onCancel={handleCloseModal} 
        />
      </Modal>
    </div>
  );
}
