import React from 'react';
import { CategoryPieChart } from './CategoryPieChart';
import { TrendLineChart } from './TrendLineChart';
import { BudgetComparison } from './BudgetComparison';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/currency';
import './AnalyticsDashboard.css';

export const AnalyticsDashboard = ({ summary, categoryData, trendData, budgetData, loading }) => {
  const { user } = useAppContext();
  const totalSpent = summary?.total || 0;
  const highestCategory = summary?.byCategory?.[0] || null;

  return (
    <div className="analytics-dashboard">
      {/* Top row: Summary Stats */}
      <div className="analytics-summary stagger-children">
        <div className="stat-card glass-card">
          <div className="stat-card__content">
            <h4 className="stat-card__title">Total Spent (This Month)</h4>
            <div className="stat-card__value">
              {loading ? <div className="skeleton-line" style={{ width: '120px', height: '32px' }}></div> : formatCurrency(totalSpent, user.base_currency)}
            </div>
          </div>
        </div>
        
        <div className="stat-card glass-card">
          <div className="stat-card__content">
            <h4 className="stat-card__title">Average per Transaction</h4>
            <div className="stat-card__value">
              {loading ? <div className="skeleton-line" style={{ width: '80px', height: '32px' }}></div> : formatCurrency(summary?.average || 0, user.base_currency)}
            </div>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-card__content">
            <h4 className="stat-card__title">Transactions</h4>
            <div className="stat-card__value">
              {loading ? <div className="skeleton-line" style={{ width: '40px', height: '32px' }}></div> : (summary?.count || 0)}
            </div>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-card__content">
            <h4 className="stat-card__title">Highest Expense</h4>
            <div className="stat-card__value" style={{ fontSize: '1.25rem' }}>
              {loading ? (
                <>
                  <div className="skeleton-line" style={{ width: '80px', height: '24px', marginBottom: '4px' }}></div>
                  <div className="skeleton-line" style={{ width: '120px', height: '16px' }}></div>
                </>
              ) : summary?.highest ? (
                <>
                  <div>{formatCurrency(summary.highest.amount, user.base_currency)}</div>
                  <div className="text-secondary" style={{ fontSize: '0.875rem', fontWeight: 500, marginTop: '4px' }}>
                    {summary.highest.title}
                  </div>
                </>
              ) : (
                <span className="text-muted">N/A</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Middle row: Charts */}
      <div className="analytics-charts mt-4 stagger-children">
        <div className="chart-container glass-card">
          <h3 className="section-title">Spending by Category</h3>
          <div className="chart-body">
            <CategoryPieChart data={categoryData} loading={loading} />
          </div>
        </div>

        <div className="chart-container glass-card">
          <h3 className="section-title">6-Month Trend</h3>
          <div className="chart-body">
            <TrendLineChart data={trendData} loading={loading} />
          </div>
        </div>
      </div>

      {/* Bottom row: Budget Comparison */}
      <div className="analytics-budget mt-4 glass-card stagger-children">
        <h3 className="section-title" style={{ padding: 'var(--space-lg) var(--space-lg) 0' }}>Budget vs Actual</h3>
        <div className="chart-body" style={{ paddingBottom: 'var(--space-lg)' }}>
          <BudgetComparison data={budgetData} loading={loading} />
        </div>
      </div>
    </div>
  );
};
