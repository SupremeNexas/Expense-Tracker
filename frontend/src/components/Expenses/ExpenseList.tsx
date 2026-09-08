import React from 'react';
import ExpenseCard from './ExpenseCard';
import { Transaction } from '../../types';
import { FileText, SearchX, AlertTriangle, RefreshCw } from 'lucide-react';

interface ExpenseListProps {
  expenses: Transaction[];
  loading: boolean;
  isError?: boolean;
  error?: any;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onRetry?: () => void;
  onEdit: (expense: Transaction) => void;
  onDelete: (expense: Transaction) => void;
}

export function ExpenseList({
  expenses,
  loading,
  isError = false,
  error = null,
  hasFilters = false,
  onClearFilters,
  onRetry,
  onEdit,
  onDelete,
}: ExpenseListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="premium-card h-24 animate-pulse flex items-center justify-between border-black/[0.04] dark:border-white/[0.04]"
          >
            <div className="flex items-center gap-4 w-full">
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="premium-card flex flex-col items-center justify-center text-center py-12 border-red-500/20 bg-red-500/5">
        <AlertTriangle className="w-10 h-10 text-red-500 mb-2" />
        <h4 className="text-sm font-semibold text-red-500">Failed to load transactions</h4>
        <p className="text-xs text-gray-400 mt-1 max-w-[320px]">
          {error?.message || 'An error occurred while fetching your ledger history.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-premium gap-2 cursor-pointer py-1.5 px-3.5 text-xs mt-4 border-red-500/20 hover:bg-red-500/10 text-red-500 font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Request
          </button>
        )}
      </div>
    );
  }

  if (expenses.length === 0) {
    if (hasFilters) {
      return (
        <div className="premium-card flex flex-col items-center justify-center text-center py-14 border-dashed border-2 border-black/[0.06] dark:border-white/[0.06]">
          <SearchX className="w-10 h-10 text-gray-400 mb-3" />
          <h4 className="text-base font-semibold">No transactions match your active filters</h4>
          <p className="text-xs text-gray-400 mt-1 max-w-[320px]">
            Try adjusting your search terms, amount range, date filters, or clear all filters to view all entries.
          </p>
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="btn-premium btn-premium-primary py-2 px-4 text-xs font-semibold mt-4 cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="premium-card flex flex-col items-center justify-center text-center py-16 border-dashed border-2 border-black/[0.06] dark:border-white/[0.06]">
        <FileText className="w-12 h-12 text-gray-400 mb-3" />
        <h4 className="text-base font-semibold">No transactions registered</h4>
        <p className="text-xs text-gray-400 mt-1 max-w-[280px]">
          Add debits or credits manually, or upload a receipt to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense) => (
        <ExpenseCard key={expense.id} expense={expense} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
export default ExpenseList;
