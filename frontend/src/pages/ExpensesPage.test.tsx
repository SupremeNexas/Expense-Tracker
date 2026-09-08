import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import ExpensesPage from './ExpensesPage';
import TransactionFilterToolbar from '../components/Expenses/TransactionFilterToolbar';
import { TransactionFilters } from '../types';

// Mock dependencies
const mockSetSearchParams = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

vi.mock('../store/authStore', () => ({
  default: () => ({ user: { baseCurrency: 'USD', isPremium: false } }),
}));

vi.mock('../components/UI/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const mockExpenses = [
  {
    id: 'tx-1',
    title: 'Starbucks Coffee',
    amount: 15.5,
    type: 'EXPENSE',
    category_id: 'cat-1',
    category_name: 'Food',
    category_color: '#EF4444',
    wallet_id: 'wall-1',
    wallet_name: 'Checking',
    date: '2026-09-01T10:00:00Z',
    payment_method: 'Card',
    tags: ['coffee', 'work'],
    notes: 'Morning meeting espresso',
  },
  {
    id: 'tx-2',
    title: 'Apple Store Laptop',
    amount: 2499.0,
    type: 'EXPENSE',
    category_id: 'cat-2',
    category_name: 'Electronics',
    category_color: '#3B82F6',
    wallet_id: 'wall-1',
    wallet_name: 'Checking',
    date: '2026-09-02T14:00:00Z',
    payment_method: 'Credit Card',
    tags: ['tech', 'work'],
    notes: 'Macbook upgrade',
  },
];

const mockGetExpenses = vi.fn().mockResolvedValue({
  data: mockExpenses,
  pagination: { total: 2, page: 1, limit: 20, totalPages: 1 },
});

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: any) => {
    if (queryKey[0] === 'expenses') {
      return { data: { data: mockExpenses, pagination: { total: 2, page: 1, limit: 20, totalPages: 1 } }, isLoading: false, isError: false, refetch: vi.fn() };
    }
    if (queryKey[0] === 'categories') {
      return { data: [{ id: 'cat-1', name: 'Food' }, { id: 'cat-2', name: 'Electronics' }], isLoading: false };
    }
    if (queryKey[0] === 'wallets') {
      return { data: [{ id: 'wall-1', name: 'Checking' }], isLoading: false };
    }
    return { data: [], isLoading: false };
  },
  useMutation: () => ({ mutate: vi.fn() }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('../api/client', () => ({
  api: {
    getExpenses: (params: any) => mockGetExpenses(params),
    getCategories: () => Promise.resolve([{ id: 'cat-1', name: 'Food' }]),
    createExpense: () => Promise.resolve({}),
    updateExpense: () => Promise.resolve({}),
    deleteExpense: () => Promise.resolve({}),
    request: () => Promise.resolve([]),
  },
}));

describe('Transaction Search & Smart Filters Component Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  test('Renders search input and quick filter dropdowns', () => {
    render(<ExpensesPage />);

    expect(screen.getByPlaceholderText(/Search merchant, notes, tag, address.../i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Wallets')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Time')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Types')).toBeInTheDocument();
    expect(screen.getByText(/Export CSV/i)).toBeInTheDocument();
    expect(screen.getByText(/Import CSV/i)).toBeInTheDocument();
  });

  test('Opens CSV Import modal when clicking Import CSV button', () => {
    render(<ExpensesPage />);

    const importBtn = screen.getByText(/Import CSV/i);
    fireEvent.click(importBtn);

    expect(screen.getByText(/Import Transactions from CSV/i)).toBeInTheDocument();
  });

  test('Renders transaction list items correctly', () => {
    render(<ExpensesPage />);

    expect(screen.getByText('Starbucks Coffee')).toBeInTheDocument();
    expect(screen.getByText('Apple Store Laptop')).toBeInTheDocument();
  });

  test('Debounced search fires search filter change', async () => {
    const mockOnFilterChange = vi.fn();
    const filters: TransactionFilters = {
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
      limit: 20,
    };

    render(
      <TransactionFilterToolbar
        filters={filters}
        categories={[{ id: 'cat-1', name: 'Food', color: '#EF4444', icon: 'Utensils', type: 'EXPENSE' }]}
        wallets={[{ id: 'wall-1', name: 'Checking', type: 'BANK', balance: 1000, color: '#3B82F6' }]}
        onFilterChange={mockOnFilterChange}
        onClearFilters={vi.fn()}
        activeCount={0}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search merchant, notes, tag, address.../i);
    fireEvent.change(searchInput, { target: { value: 'Starbucks' } });

    await waitFor(
      () => {
        expect(mockOnFilterChange).toHaveBeenCalledWith({ search: 'Starbucks', page: 1 });
      },
      { timeout: 500 }
    );
  });

  test('Toggles advanced filter drawer and displays active filter chips', () => {
    const mockOnFilterChange = vi.fn();
    const mockOnClearFilters = vi.fn();
    const filters: TransactionFilters = {
      search: 'Starbucks',
      categoryId: 'cat-1',
      walletId: '',
      type: 'EXPENSE',
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
      limit: 20,
    };

    render(
      <TransactionFilterToolbar
        filters={filters}
        categories={[{ id: 'cat-1', name: 'Food', color: '#EF4444', icon: 'Utensils', type: 'EXPENSE' }]}
        wallets={[{ id: 'wall-1', name: 'Checking', type: 'BANK', balance: 1000, color: '#3B82F6' }]}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
        activeCount={3}
      />
    );

    // Toggle More Filters button
    const moreFiltersBtn = screen.getByText(/More Filters/i);
    fireEvent.click(moreFiltersBtn);

    expect(screen.getByText(/Advanced Smart Filters/i)).toBeInTheDocument();
    expect(screen.getByText('Query: "Starbucks"')).toBeInTheDocument();
    expect(screen.getByText('Category: Food')).toBeInTheDocument();

    // Click Clear All
    const clearAllBtns = screen.getAllByText(/Clear All/i);
    fireEvent.click(clearAllBtns[0]);
    expect(mockOnClearFilters).toHaveBeenCalled();
  });
});
