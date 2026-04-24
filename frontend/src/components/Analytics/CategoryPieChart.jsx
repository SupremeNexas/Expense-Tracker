import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { EmptyState } from '../UI/EmptyState';

export const CategoryPieChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="skeleton-icon" style={{ width: '200px', height: '200px', borderRadius: '50%' }}></div>
      </div>
    );
  }

  const hasData = data && data.length > 0 && data.some(d => d.total > 0);

  if (!hasData) {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState 
          iconName="PieChart"
          title="No data"
          description="Add expenses to see breakdown."
        />
      </div>
    );
  }

  // Filter out categories with 0 total
  const chartData = data.filter(d => d.total > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card" style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{data.name}</div>
          <div style={{ color: data.color }}>${data.total.toFixed(2)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="total"
          stroke="none"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="bottom" 
          height={36} 
          iconType="circle"
          formatter={(value, entry) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
