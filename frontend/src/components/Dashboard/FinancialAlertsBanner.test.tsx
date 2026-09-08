import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import FinancialAlertsBanner from './FinancialAlertsBanner';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockAlerts = [
  {
    id: 'budget-alert-1',
    type: 'BUDGET_ALERT',
    severity: 'danger',
    title: 'Budget Exceeded: Dining Out',
    message: 'You have spent 120% of your Dining Out budget.',
    spent: 600,
    limit: 500,
    percentage: 120,
    categoryName: 'Dining Out',
    actionUrl: '/budgets',
  },
  {
    id: 'card-util-1',
    type: 'CREDIT_CARD_ALERT',
    severity: 'warning',
    title: 'Moderate Credit Card Utilization: Sapphire',
    message: 'Card utilization is at 45%.',
    spent: 4500,
    limit: 10000,
    percentage: 45,
    cardName: 'Sapphire',
    actionUrl: '/credit-cards',
  },
];

const mockDismissAlert = vi.fn().mockResolvedValue({ success: true });

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: { alerts: mockAlerts },
    isLoading: false,
    isError: false,
  }),
  useMutation: (opts: any) => ({
    mutate: (alertId: string) => {
      opts.onSuccess({}, alertId);
    },
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

vi.mock('../../api/client', () => ({
  api: {
    getAlerts: vi.fn(),
    dismissAlert: (id: string) => mockDismissAlert(id),
  },
}));

describe('FinancialAlertsBanner Component Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Renders active financial alerts with proper badges and text', () => {
    render(<FinancialAlertsBanner />);

    expect(screen.getByText(/Active Financial Alerts \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText('Budget Exceeded: Dining Out')).toBeInTheDocument();
    expect(screen.getByText('Moderate Credit Card Utilization: Sapphire')).toBeInTheDocument();
    expect(screen.getByText('120% spent')).toBeInTheDocument();
  });

  test('Navigates to detail view when clicking action link', () => {
    render(<FinancialAlertsBanner />);

    const manageBtn = screen.getByText('Manage Dining Out');
    fireEvent.click(manageBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/budgets');
  });

  test('Allows dismissing an alert from the banner', () => {
    render(<FinancialAlertsBanner />);

    const dismissBtns = screen.getAllByTitle('Dismiss alert');
    fireEvent.click(dismissBtns[0]);

    // Should remove first alert from active list and show 1 remaining
    expect(screen.getByText(/Active Financial Alerts \(1\)/i)).toBeInTheDocument();
  });
});
