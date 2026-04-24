import React, { useState, useEffect } from 'react';
import { Plus, Repeat, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/UI/Toast';
import { Modal } from '../components/UI/Modal';
import { SubscriptionForm } from '../components/Subscriptions/SubscriptionForm';
import { useAppContext } from '../context/AppContext';
import { formatCurrency } from '../utils/currency';

export const SubscriptionsPage = () => {
  const { user } = useAppContext();
  const { showToast } = useToast();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSubs = async () => {
    setLoading(true);
    try {
      const data = await api.getSubscriptions();
      setSubscriptions(data);
    } catch (err) {
      showToast('Failed to load subscriptions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubs(); }, []);

  const handleCreate = async (data) => {
    try {
      await api.createSubscription(data);
      showToast('Subscription added', 'success');
      setIsModalOpen(false);
      fetchSubs();
    } catch (err) {
      showToast('Failed to add subscription', 'error');
    }
  };

  const handleToggleCycle = async (sub) => {
    const newCycle = sub.billing_cycle === 'monthly' ? 'yearly' : 'monthly';
    try {
      await api.updateSubscription(sub.id, {
        name: sub.name,
        cost: sub.cost,
        billing_cycle: newCycle,
        renewal_date: sub.renewal_date,
        payment_source: sub.payment_source,
        is_active: sub.is_active
      });
      showToast(`Switched to ${newCycle}`, 'success');
      fetchSubs();
    } catch (err) {
      showToast('Failed to update subscription', 'error');
    }
  };

  const handleDelete = async (sub) => {
    if (!window.confirm(`Remove "${sub.name}" subscription?`)) return;
    try {
      await api.deleteSubscription(sub.id);
      showToast('Subscription deleted', 'success');
      fetchSubs();
    } catch (err) {
      showToast('Failed to delete subscription', 'error');
    }
  };

  const totalMonthlyBurn = subscriptions
    .filter(s => s.is_active)
    .reduce((acc, s) => acc + (s.billing_cycle === 'yearly' ? s.cost / 12 : s.cost), 0);

  const totalYearlyBurn = subscriptions
    .filter(s => s.is_active)
    .reduce((acc, s) => acc + (s.billing_cycle === 'monthly' ? s.cost * 12 : s.cost), 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Subscription Intelligence</h1>
          <p className="text-secondary mt-1">Track your recurring services and optimize your monthly burn.</p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Add Subscription
          </button>
        </div>
      </div>

      <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
          <div className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '8px' }}>Total Monthly Burn</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{formatCurrency(totalMonthlyBurn, user.base_currency)}</div>
        </div>
        <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
          <div className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '8px' }}>Projected Yearly Cost</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{formatCurrency(totalYearlyBurn, user.base_currency)}</div>
        </div>
        <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
          <div className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '8px' }}>Active Subscriptions</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{subscriptions.filter(s => s.is_active).length}</div>
        </div>
      </div>

      <div className="glass-card stagger-children" style={{ padding: 'var(--space-xl)' }}>
        {loading ? (
          <div>Loading...</div>
        ) : subscriptions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-2xl) 0' }}>
            <Repeat size={48} className="text-muted" style={{ marginBottom: '16px' }} />
            <h3>No subscriptions tracked</h3>
            <p className="text-secondary">Start adding your Netflix, Spotify, or Prime accounts.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                <th style={{ textAlign: 'left', padding: '12px 0' }}>Service</th>
                <th style={{ textAlign: 'left', padding: '12px 0' }}>Cost</th>
                <th style={{ textAlign: 'left', padding: '12px 0' }}>Cycle</th>
                <th style={{ textAlign: 'left', padding: '12px 0' }}>Next Renewal</th>
                <th style={{ textAlign: 'left', padding: '12px 0' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '12px 0' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map(sub => (
                <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px 0', fontWeight: 600 }}>{sub.name}</td>
                  <td style={{ padding: '16px 0' }}>{formatCurrency(sub.cost, user.base_currency)}</td>
                  <td style={{ padding: '16px 0' }}>
                    <button 
                      className="btn btn--ghost"
                      style={{ padding: '4px 10px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => handleToggleCycle(sub)}
                      title={`Click to switch to ${sub.billing_cycle === 'monthly' ? 'yearly' : 'monthly'}`}
                    >
                      {sub.billing_cycle === 'monthly' ? (
                        <ToggleLeft size={16} style={{ color: 'var(--accent-indigo)' }} />
                      ) : (
                        <ToggleRight size={16} style={{ color: 'var(--accent-emerald)' }} />
                      )}
                      <span style={{ textTransform: 'capitalize' }}>{sub.billing_cycle}</span>
                    </button>
                  </td>
                  <td style={{ padding: '16px 0' }}>{new Date(sub.renewal_date).toLocaleDateString()}</td>
                  <td style={{ padding: '16px 0' }}>
                    <span className={`badge ${sub.is_active ? 'badge--success' : 'badge--warning'}`}>
                      {sub.is_active ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 0', textAlign: 'right' }}>
                    <button 
                      className="btn btn--icon btn--ghost" 
                      title="Delete"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => handleDelete(sub)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Subscription Details">
        <div style={{ padding: 'var(--space-md)' }}>
          <SubscriptionForm 
            onSubmit={handleCreate} 
            onCancel={() => setIsModalOpen(false)} 
          />
        </div>
      </Modal>
    </div>
  );
};
