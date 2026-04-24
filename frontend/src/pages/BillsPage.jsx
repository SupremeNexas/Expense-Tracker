import React, { useState, useEffect } from 'react';
import { Plus, CalendarClock } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/UI/Toast';
import { Modal } from '../components/UI/Modal';
import { BillForm } from '../components/Bills/BillForm';
import { useAppContext } from '../context/AppContext';
import { formatCurrency } from '../utils/currency';

export const BillsPage = () => {
  const { user } = useAppContext();
  const { showToast } = useToast();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      try {
        const data = await api.getBills();
        setBills(data);
      } catch (err) {
        showToast('Failed to load bills', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, [showToast]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const data = await api.getBills();
      setBills(data);
    } catch (err) {
      showToast('Failed to load bills', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    try {
      await api.createBill(data);
      showToast('Bill added', 'success');
      setIsModalOpen(false);
      fetchBills();
    } catch (err) {
      showToast('Failed to add bill', 'error');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Recurring Bills</h1>
          <p className="text-secondary mt-1">A timeline of your upcoming obligations.</p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Add Bill
          </button>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : bills.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-3xl) 0' }}>
          <CalendarClock size={48} className="text-muted" style={{ marginBottom: '16px' }} />
          <h3>No bills tracked</h3>
          <p className="text-secondary">Add your rent, utilities, and insurance payments.</p>
        </div>
      ) : (
        <div className="glass-card stagger-children" style={{ padding: 'var(--space-xl)' }}>
          {bills.map((bill, idx) => (
            <div key={bill.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '16px 0',
              borderBottom: idx !== bills.length - 1 ? '1px solid var(--glass-border)' : 'none'
            }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0' }}>{bill.name}</h4>
                <div className="text-secondary" style={{ fontSize: '0.875rem' }}>
                  Due: {new Date(bill.due_date).toLocaleDateString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatCurrency(bill.amount, user.base_currency)}</div>
                <div className={`badge ${bill.status === 'paid' ? 'badge--success' : bill.status === 'overdue' ? 'badge--danger' : 'badge--warning'}`} style={{ marginTop: '4px' }}>
                  {bill.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Recurring Bill Details">
        <div style={{ padding: 'var(--space-md)' }}>
          <BillForm 
            onSubmit={handleCreate} 
            onCancel={() => setIsModalOpen(false)} 
          />
        </div>
      </Modal>
    </div>
  );
};
