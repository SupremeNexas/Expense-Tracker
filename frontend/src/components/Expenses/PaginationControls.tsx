import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  onLimitChange,
}: PaginationControlsProps) {
  if (totalItems <= 0) return null;

  const startItem = Math.min((currentPage - 1) * limit + 1, totalItems);
  const endItem = Math.min(currentPage * limit, totalItems);

  // Generate visible page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="premium-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-black/[0.05] dark:border-white/[0.05] mt-6">
      {/* Items count & Per Page Selector */}
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span>
          Showing <strong className="text-black dark:text-white font-semibold">{startItem}–{endItem}</strong> of{' '}
          <strong className="text-black dark:text-white font-semibold">{totalItems}</strong> transactions
        </span>
        <div className="flex items-center gap-1.5 ml-2 border-l border-black/10 dark:border-white/10 pl-3">
          <span>Per page:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="input-premium py-1 px-2 text-xs cursor-pointer w-16"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Page Navigation Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="btn-premium p-1.5 text-xs gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1 px-1">
          {getPageNumbers().map((page, idx) =>
            typeof page === 'number' ? (
              <button
                key={idx}
                onClick={() => onPageChange(page)}
                className={`min-w-[32px] h-8 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  currentPage === page
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                    : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                }`}
              >
                {page}
              </button>
            ) : (
              <span key={idx} className="px-1 text-xs text-gray-400">
                {page}
              </span>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="btn-premium p-1.5 text-xs gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default PaginationControls;
