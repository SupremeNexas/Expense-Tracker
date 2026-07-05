import React from 'react';
import { format, parseISO } from 'date-fns';
import { Edit2, Trash2, CreditCard, ShoppingBag, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { formatCurrency } from '../../utils/currency';
import { Transaction } from '../../types';

interface ExpenseCardProps {
  expense: Transaction;
  onEdit: (expense: Transaction) => void;
  onDelete: (expense: Transaction) => void;
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  const { user } = useAuthStore();
  const tags = Array.isArray(expense.tags) ? expense.tags : [];

  return (
    <div className="premium-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-black/[0.05] dark:border-white/[0.05]">
      <div className="flex items-center gap-4">
        {/* Category Icon Wrapper */}
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
          style={{ backgroundColor: expense.category_color || '#10B981' }}
        >
          {expense.type === 'INCOME' ? (
            <ArrowDownRight className="w-5 h-5" />
          ) : (
            <ArrowUpRight className="w-5 h-5" />
          )}
        </div>

        {/* Transaction Content */}
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h4 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-[280px]">
              {expense.title}
            </h4>
            <span className="text-[10px] text-gray-400 font-medium">({expense.category_name})</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-gray-400">
            <span>{format(parseISO(expense.date), 'MMM d, yyyy')}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5" />
              {expense.payment_method || 'UPI'}
            </span>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  className="px-2 py-0.5 rounded-full text-[10px] bg-black/[0.03] dark:bg-white/[0.03] text-gray-500 font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Notes */}
          {expense.notes && (
            <p className="text-xs text-gray-400 italic mt-1.5 border-l-2 border-black/[0.06] dark:border-white/[0.06] pl-2 line-clamp-2">
              {expense.notes}
            </p>
          )}
        </div>
      </div>

      {/* Right details & operations */}
      <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 border-black/[0.04] dark:border-white/[0.04] pt-3 sm:pt-0">
        <span className={`text-base font-bold font-sans ${expense.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'}`}>
          {expense.type === 'INCOME' ? '+' : '-'} {formatCurrency(expense.amount, user?.baseCurrency)}
        </span>

        {/* Action icons */}
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit(expense)}
            className="p-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(expense)}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
export default ExpenseCard;
