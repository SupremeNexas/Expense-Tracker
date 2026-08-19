import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EmptyState } from '../UI/EmptyState';
import { formatCurrency } from '../../utils/currency';
import useAuthStore from '../../store/authStore';

const CustomTooltip = ({ active, payload, label }) => {
  const { user } = useAuthStore();
  if (active && payload && payload.length) {
    return (
      <div className="glass-card" style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '4px' }}>{label}</div>
        <div style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>{formatCurrency(payload[0].value, user?.baseCurrency)}</div>
      </div>
    );
  }
  return null;
};

export const TrendLineChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="chart-skeleton" style={{ padding: 'var(--space-xl)' }}>
        <div className="skeleton-line" style={{ height: '80%' }}></div>
        <div className="skeleton-line" style={{ height: '40%' }}></div>
        <div className="skeleton-line" style={{ height: '90%' }}></div>
        <div className="skeleton-line" style={{ height: '60%' }}></div>
        <div className="skeleton-line" style={{ height: '70%' }}></div>
        <div className="skeleton-line" style={{ height: '50%' }}></div>
      </div>
    );
  }

  const hasData = data && data.some(d => d.total > 0);

  if (!hasData) {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState 
          iconName="TrendingUp"
          title="No trends available"
          description="Insufficient data to show spending trends."
        />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', padding: '0 var(--space-md) var(--space-md) 0' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0}/>
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
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="total" 
            stroke="var(--accent-purple)" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorTrend)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
