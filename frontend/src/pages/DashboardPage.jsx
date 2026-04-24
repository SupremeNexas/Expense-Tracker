import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowUpRight, ArrowDownRight, CreditCard, Repeat, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { api } from '../api/client';
import { StatCard } from '../components/Dashboard/StatCard';
import { RecentExpenses } from '../components/Dashboard/RecentExpenses';
import { SpendingChart } from '../components/Dashboard/SpendingChart';
import { formatCurrency } from '../utils/currency';

export const DashboardPage = () => {
  const { user, expenses, loading } = useAppContext();
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState(null);
  const [insights, setInsights] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const [summaryData, trendData, insightsData] = await Promise.all([
          api.getSummary({ month, year }),
          api.getTrend(),
          api.getInsights()
        ]);

        setSummary(summaryData);
        setTrend(trendData);
        setInsights(insightsData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboardData();
  }, [expenses]);

  const isLoading = loading || dashboardLoading;

  // Calculate some dummy "Cash Flow" numbers for the Fintech feel based on total spent
  const totalSpent = summary?.total || 0;
  const estimatedIncome = totalSpent > 0 ? totalSpent * 2.5 : 5000; // Mock income for demo
  const netBalance = estimatedIncome - totalSpent;
  const savingsRate = estimatedIncome > 0 ? ((netBalance / estimatedIncome) * 100).toFixed(1) : 0;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Executive Dashboard</h1>
          <p className="text-secondary mt-1">Welcome back, {user?.name}. Here is your financial overview.</p>
        </div>
        <div className="page-header__actions">
          <Link to="/expenses" className="btn btn--primary">
            <Plus size={18} /> Quick Add
          </Link>
        </div>
      </div>

      {/* Fintech Hero Section: Cash Flow & Net Balance */}
      <div className="glass-card mb-4 stagger-children" style={{ display: 'flex', flexWrap: 'wrap', padding: 'var(--space-xl)', gap: 'var(--space-xl)', alignItems: 'center' }}>
        <div style={{ flex: '1 1 200px' }}>
          <div className="text-secondary" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', marginBottom: '8px' }}>Net Balance</div>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {formatCurrency(netBalance, user.base_currency)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap' }}>
          <div>
            <div className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '4px' }}>Inflow (Est.)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowDownRight size={18} /> {formatCurrency(estimatedIncome, user.base_currency)}
            </div>
          </div>
          <div>
            <div className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '4px' }}>Outflow</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpRight size={18} className="text-danger" /> {formatCurrency(totalSpent, user.base_currency)}
            </div>
          </div>
          <div>
            <div className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '4px' }}>Savings Rate</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-indigo)' }}>
              {savingsRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Smart Insights & Alerts Row */}
      {insights.length > 0 && (
        <div className="stagger-children mb-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
          {insights.map((insight, idx) => (
            <div key={idx} className="glass-card" style={{ padding: 'var(--space-md)', borderLeft: `4px solid var(--${insight.type})` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ color: `var(--${insight.type})`, marginTop: '2px' }}>
                  {insight.type === 'danger' || insight.type === 'warning' ? <AlertCircle size={20} /> : <Repeat size={20} />}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9375rem' }}>{insight.title}</h4>
                  <p className="text-secondary" style={{ fontSize: '0.875rem', margin: 0 }}>{insight.message}</p>
                  {insight.actionUrl && (
                    <Link to={insight.actionUrl} style={{ fontSize: '0.8125rem', fontWeight: 600, marginTop: '8px', display: 'inline-block' }}>
                      Review &rarr;
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-md)' }}>
        <div style={{ minHeight: '350px' }}>
          <SpendingChart data={trend?.slice().reverse()} loading={isLoading} />
        </div>
        <div>
          <RecentExpenses expenses={expenses} loading={isLoading} />
        </div>
      </div>
    </div>
  );
};
