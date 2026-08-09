import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EmptyState } from '../UI/EmptyState';
import './SpendingChart.css';

export const SpendingChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="spending-chart-container glass-card">
        <h3 className="section-title">Spending Overview</h3>
        <div className="chart-skeleton">
          <div className="skeleton-line" style={{ height: '80%' }}></div>
          <div className="skeleton-line" style={{ height: '60%' }}></div>
          <div className="skeleton-line" style={{ height: '90%' }}></div>
          <div className="skeleton-line" style={{ height: '40%' }}></div>
          <div className="skeleton-line" style={{ height: '70%' }}></div>
          <div className="skeleton-line" style={{ height: '50%' }}></div>
        </div>
      </div>
    );
  }

  const hasData = data && data.some(item => item.total > 0);

  return (
    <div className="spending-chart-container glass-card">
      <h3 className="section-title">Spending Overview (Last 6 Months)</h3>
      
      {!hasData ? (
        <EmptyState 
          iconName="BarChart2" 
          title="No data available" 
          description="Add expenses to see your spending trends over time."
        />
      ) : (
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-teal)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--accent-teal)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderColor: 'var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  backdropFilter: 'blur(12px)',
                  color: 'var(--text-primary)'
                }}
                itemStyle={{ color: 'var(--accent-teal)' }}
                formatter={(value) => [`₹${value}`, 'Spent']}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="var(--accent-teal)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
