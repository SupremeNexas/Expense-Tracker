import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { AnalyticsDashboard } from '../components/Analytics/AnalyticsDashboard';
import { useToast } from '../components/UI/Toast';

export const AnalyticsPage = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [budgetData, setBudgetData] = useState([]);
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [summaryRes, categoryRes, trendRes, budgetRes] = await Promise.all([
          api.getSummary({ month, year }),
          api.getByCategory({ month, year }),
          api.getTrend(),
          api.getBudgetStatus({ month, year })
        ]);
        
        setSummary(summaryRes);
        setCategoryData(categoryRes);
        setTrendData(trendRes.reverse()); // Chronological order
        setBudgetData(budgetRes);
      } catch (err) {
        showToast('Failed to load analytics data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [month, year, showToast]);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: 'var(--space-md)' }}>
        <div>
          <h1>Analytics</h1>
          <p className="text-secondary mt-1">Deep dive into your spending patterns and trends.</p>
        </div>
        <div className="page-header__actions">
          <select 
            className="form-select glass-card" 
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {[
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ].map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select 
            className="form-select glass-card" 
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {[...Array(5)].map((_, i) => {
              const y = new Date().getFullYear() - i;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
        </div>
      </div>

      <AnalyticsDashboard 
        summary={summary}
        categoryData={categoryData}
        trendData={trendData}
        budgetData={budgetData}
        loading={loading}
      />
    </div>
  );
};
