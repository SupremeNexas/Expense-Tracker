import React from 'react';
import ExpenseCard from './ExpenseCard';
import { Transaction } from '../../types';
import { FileText } from 'lucide-react';

interface ExpenseListProps {
  expenses: Transaction[];
  loading: boolean;
  onEdit: (expense: Transaction) => void;
  onDelete: (expense: Transaction) => void;
}

export function ExpenseList({ expenses, loading, onEdit, onDelete }: ExpenseListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="premium-card h-24 animate-pulse flex items-center justify-between border-black/[0.04] dark:border-white/[0.04]">
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

  if (expenses.length === 0) {
    return (
      <div className="premium-card flex flex-col items-center justify-center text-center py-16 border-dashed border-2 border-black/[0.06] dark:border-white/[0.06]">
        <FileText className="w-12 h-12 text-gray-400 mb-3" />
        <h4 className="text-base font-semibold">No transactions registered</h4>
        <p className="text-xs text-gray-400 mt-1 max-w-[280px]">Add debits or credits manually, or upload a receipt to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {expenses.map(expense => (
        <ExpenseCard 
          key={expense.id} 
          expense={expense} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />
      ))}
    </div>
  );
}
export default ExpenseList;
