import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Plus, Receipt, Download, Upload } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/UI/Toast';
import ExpenseList from '../components/Expenses/ExpenseList';
import ExpenseForm from '../components/Expenses/ExpenseForm';
import BillScannerModal from '../components/Expenses/BillScannerModal';
import CSVImportModal from '../components/Expenses/CSVImportModal';
import TransactionFilterToolbar from '../components/Expenses/TransactionFilterToolbar';
import PaginationControls from '../components/Expenses/PaginationControls';
import Modal from '../components/UI/Modal';
import { Category, Wallet, Transaction, TransactionFilters } from '../types';

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCSVImportOpen, setIsCSVImportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Transaction | null>(null);

  // Initialize filter state from URL search params for persistent filtering across navigation/reload
  const [filters, setFilters] = useState<TransactionFilters>({
    search: searchParams.get('search') || '',
    categoryId: searchParams.get('categoryId') || '',
    walletId: searchParams.get('walletId') || '',
    type: searchParams.get('type') || 'ALL',
    paymentMethod: searchParams.get('paymentMethod') || '',
    amountMode: (searchParams.get('amountMode') as any) || 'any',
    exactAmount: searchParams.get('exactAmount') || '',
    minAmount: searchParams.get('minAmount') || '',
    maxAmount: searchParams.get('maxAmount') || '',
    datePreset: searchParams.get('datePreset') || 'all',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    tags: searchParams.get('tags') || '',
    scope: searchParams.get('scope') || 'ALL',
    sort: searchParams.get('sort') || 'date',
    order: (searchParams.get('order') as any) || 'desc',
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 20,
  });

  // Calculate count of active filters for badge counter
  const activeFilterCount = [
    filters.search,
    filters.categoryId,
    filters.walletId,
    filters.type !== 'ALL' ? filters.type : '',
    filters.paymentMethod,
    filters.exactAmount || filters.minAmount || filters.maxAmount ? 'amount' : '',
    filters.datePreset !== 'all' ? filters.datePreset : '',
    filters.startDate,
    filters.endDate,
    filters.tags,
    filters.scope !== 'ALL' ? filters.scope : '',
  ].filter(Boolean).length;

  const handleFilterChange = (updated: Partial<TransactionFilters>) => {
    setFilters((prev) => {
      const next = { ...prev, ...updated };
      const newParams: Record<string, string> = {};
      Object.keys(next).forEach((key) => {
        const val = (next as any)[key];
        if (
          val !== undefined &&
          val !== null &&
          val !== '' &&
          val !== 'ALL' &&
          val !== 'all' &&
          val !== 'any'
        ) {
          newParams[key] = String(val);
        }
      });
      setSearchParams(newParams, { replace: true });
      return next;
    });
  };

  const handleClearFilters = () => {
    const cleared: TransactionFilters = {
      search: '',
      categoryId: '',
      walletId: '',
      type: 'ALL',
      paymentMethod: '',
      amountMode: 'any',
      exactAmount: '',
      minAmount: '',
      maxAmount: '',
      datePreset: 'all',
      startDate: '',
      endDate: '',
      tags: '',
      scope: 'ALL',
      sort: 'date',
      order: 'desc',
      page: 1,
      limit: filters.limit,
    };
    setFilters(cleared);
    setSearchParams({}, { replace: true });
  };

  // Build API Query Parameters
  const apiQueryParams: Record<string, any> = {
    search: filters.search,
    category_id: filters.categoryId,
    wallet_id: filters.walletId,
    type: filters.type,
    payment_method: filters.paymentMethod,
    amount: filters.amountMode === 'exact' ? filters.exactAmount : '',
    minAmount:
      filters.amountMode === 'range' || filters.amountMode === 'min' ? filters.minAmount : '',
    maxAmount:
      filters.amountMode === 'range' || filters.amountMode === 'max' ? filters.maxAmount : '',
    startDate: filters.startDate,
    endDate: filters.endDate,
    tags: filters.tags,
    scope: filters.scope,
    sort: filters.sort,
    order: filters.order,
    page: filters.page,
    limit: filters.limit,
    paginate: 'true',
  };

  // Server-side filtered query
  const {
    data: expensesData,
    isLoading: expensesLoading,
    isError: expensesError,
    error: expensesErrObj,
    refetch: refetchExpenses,
  } = useQuery({
    queryKey: ['expenses', apiQueryParams],
    queryFn: () => api.getExpenses(apiQueryParams),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  const { data: wallets = [] } = useQuery<Wallet[]>({
    queryKey: ['wallets'],
    queryFn: () => api.request('/expenses/wallets'),
  });

  // Extract items list & pagination metadata safely
  const expensesList: Transaction[] = Array.isArray(expensesData)
    ? expensesData
    : expensesData?.data || [];
  const totalItems: number = Array.isArray(expensesData)
    ? expensesData.length
    : expensesData?.pagination?.total || 0;
  const totalPages: number = Array.isArray(expensesData)
    ? 1
    : expensesData?.pagination?.totalPages || 1;

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
    },
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
    },
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
    },
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

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await api.exportExpenses(apiQueryParams);
      showToast('Transactions exported successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to export CSV', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ledger Transactions</h1>
          <p className="text-sm text-gray-400 mt-1">
            Search, filter, import, and audit your transaction history.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="btn-premium py-2 px-3 text-xs gap-1.5 cursor-pointer border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 font-medium"
            title="Export filtered transactions to CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" /> Export CSV
          </button>
          <button
            onClick={() => setIsCSVImportOpen(true)}
            className="btn-premium py-2 px-3 text-xs gap-1.5 cursor-pointer border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 font-medium"
            title="Import transactions from CSV file"
          >
            <Upload className="w-3.5 h-3.5 text-blue-500" /> Import CSV
          </button>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="btn-premium py-2 px-3 text-xs gap-1.5 cursor-pointer border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 font-medium"
          >
            <Receipt className="w-3.5 h-3.5 text-purple-500" /> Scan Receipt
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="btn-premium btn-premium-primary gap-1.5 cursor-pointer py-2 px-3.5 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" /> Add Transaction
          </button>
        </div>
      </div>

      {/* Smart Search & Filter Toolbar */}
      <TransactionFilterToolbar
        filters={filters}
        categories={categories}
        wallets={wallets}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        activeCount={activeFilterCount}
      />

      {/* Transactions List */}
      <ExpenseList
        expenses={expensesList}
        loading={expensesLoading}
        isError={expensesError}
        error={expensesErrObj}
        hasFilters={activeFilterCount > 0}
        onClearFilters={handleClearFilters}
        onRetry={refetchExpenses}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
      />

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={filters.page}
        totalPages={totalPages}
        totalItems={totalItems}
        limit={filters.limit}
        onPageChange={(page) => handleFilterChange({ page })}
        onLimitChange={(limit) => handleFilterChange({ limit, page: 1 })}
      />

      {/* Bill Scanner Modal */}
      <BillScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />

      {/* CSV Import Modal */}
      <CSVImportModal isOpen={isCSVImportOpen} onClose={() => setIsCSVImportOpen(false)} />

      {/* Edit/Create Dialog Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingExpense ? 'Modify Transaction' : 'New Transaction'}
        description={
          editingExpense ? 'Update the details of this transaction.' : 'Record an expense or income.'
        }
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
