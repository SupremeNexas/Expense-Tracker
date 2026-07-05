import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { EmptyState } from '../UI/EmptyState';

export const BudgetComparison = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="chart-skeleton" style={{ padding: 'var(--space-xl)' }}>
        <div className="skeleton-line" style={{ height: '60%' }}></div>
        <div className="skeleton-line" style={{ height: '80%' }}></div>
        <div className="skeleton-line" style={{ height: '40%' }}></div>
        <div className="skeleton-line" style={{ height: '90%' }}></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState 
          iconName="Wallet"
          title="No budgets set"
          description="Create budgets to compare with your actual spending."
        />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isOverBudget = payload[0].payload.over_budget;
      return (
        <div className="glass-card" style={{ padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>{label}</div>
          {payload.map((entry, index) => (
            <div key={index} style={{ color: entry.color, display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '0.875rem', marginBottom: '4px' }}>
              <span>{entry.name}:</span>
              <span style={{ fontWeight: 600 }}>₹{entry.value.toFixed(2)}</span>
            </div>
          ))}
          {isOverBudget && (
            <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '8px', fontWeight: 600 }}>
              Over budget by ₹{payload[0].payload.remaining.toString().replace('-', '')}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '100%', padding: '0 var(--space-md) var(--space-md) 0', minHeight: '350px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
          <XAxis 
            dataKey="category_name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            dy={10}
            angle={-45}
            textAnchor="end"
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            tickFormatter={(value) => `₹${value}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-input)' }} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar dataKey="amount" name="Budget" fill="var(--bg-input-focus)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="spent" name="Spent" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.over_budget ? 'var(--danger)' : entry.category_color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
