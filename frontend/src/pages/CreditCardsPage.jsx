import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, ShieldAlert, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/UI/Toast';
import { Modal } from '../components/UI/Modal';
import { CreditCardForm } from '../components/CreditCards/CreditCardForm';
import { useAppContext } from '../context/AppContext';
import { formatCurrency } from '../utils/currency';

export const CreditCardsPage = () => {
  const { user } = useAppContext();
  const { showToast } = useToast();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const data = await api.getCreditCards();
      setCards(data);
    } catch (err) {
      showToast('Failed to load credit cards', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleCreate = async (data) => {
    try {
      await api.createCreditCard(data);
      showToast('Credit Card added', 'success');
      setIsModalOpen(false);
      fetchCards();
    } catch (err) {
      showToast('Failed to add credit card', 'error');
    }
  };

  const handleDelete = async (cardId, cardName) => {
    if (!window.confirm(`Are you sure you want to delete "${cardName}"? This action cannot be undone.`)) return;
    try {
      await api.deleteCreditCard(cardId);
      showToast('Credit card deleted', 'success');
      fetchCards();
    } catch (err) {
      showToast('Failed to delete credit card', 'error');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Liability Manager</h1>
          <p className="text-secondary mt-1">Track credit limits, due dates, and mitigate interest risks.</p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Add Card
          </button>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : cards.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-3xl) 0' }}>
          <CreditCard size={48} className="text-muted" style={{ marginBottom: '16px' }} />
          <h3>No credit cards added</h3>
          <p className="text-secondary">Start tracking your liabilities to avoid missed payments.</p>
        </div>
      ) : (
        <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-lg)' }}>
          {cards.map(card => (
            <div key={card.id} className="glass-card" style={{ padding: 'var(--space-xl)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: card.risk_level === 'High' ? 'var(--danger)' : card.risk_level === 'Medium' ? 'var(--warning)' : 'var(--success)' }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0' }}>{card.name}</h3>
                  <div className={`badge ${card.risk_level === 'High' ? 'badge--danger' : card.risk_level === 'Medium' ? 'badge--warning' : 'badge--success'}`}>
                    {card.risk_level} Risk
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={24} className="text-secondary" />
                  <button 
                    className="btn btn--icon btn--ghost" 
                    title="Delete card"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => handleDelete(card.id, card.name)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="text-secondary" style={{ fontSize: '0.875rem' }}>Credit Usage ({card.usage_percentage || 0}%)</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{formatCurrency(card.total_due, 'INR')} / {formatCurrency(card.limit_amount, 'INR')}</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${Math.min(card.usage_percentage, 100)}%`, 
                    background: card.risk_level === 'High' ? 'var(--danger)' : card.risk_level === 'Medium' ? 'var(--warning)' : 'var(--success)',
                    transition: 'width 1s ease'
                  }}></div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'var(--space-lg)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--glass-border)' }}>
                <div>
                  <div className="text-secondary" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Minimum Due</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatCurrency(card.minimum_due, 'INR')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="text-secondary" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due In</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: card.days_until_due <= 5 ? 'var(--danger)' : 'var(--text-primary)' }}>
                    {card.days_until_due} Days
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Credit Card Details">
        <div style={{ padding: 'var(--space-md)' }}>
          <CreditCardForm 
            onSubmit={handleCreate} 
            onCancel={() => setIsModalOpen(false)} 
          />
        </div>
      </Modal>
    </div>
  );
};
