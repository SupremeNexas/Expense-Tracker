import React, { useState } from 'react';
import { Plus, Filter } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { api } from '../api/client';
import { ExpenseList } from '../components/Expenses/ExpenseList';
import { ExpenseForm } from '../components/Expenses/ExpenseForm';
import { Modal } from '../components/UI/Modal';
import { useToast } from '../components/UI/Toast';

export const ExpensesPage = () => {
  const { expenses, categories, loading, refreshData } = useAppContext();
  const { showToast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  
  // Filters
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const filteredExpenses = expenses.filter(expense => {
    let matches = true;
    if (filterCategory) {
      matches = matches && expense.category_id.toString() === filterCategory;
    }
    if (filterMonth) {
      const expMonth = expense.date.substring(0, 7); // YYYY-MM
      matches = matches && expMonth === filterMonth;
    }
    return matches;
  });

  const handleOpenModal = (expense = null) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingExpense(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (data) => {
    try {
      if (editingExpense) {
        await api.updateExpense(editingExpense.id, data);
        showToast('Expense updated successfully', 'success');
      } else {
        await api.createExpense(data);
        showToast('Expense added successfully', 'success');
      }
      handleCloseModal();
      refreshData(); // Refresh global state
    } catch (err) {
      showToast(err.message || 'Failed to save expense', 'error');
    }
  };

  const handleDelete = async (expense) => {
    if (window.confirm(`Are you sure you want to delete "${expense.title}"?`)) {
      try {
        await api.deleteExpense(expense.id);
        showToast('Expense deleted successfully', 'success');
        refreshData();
      } catch (err) {
        showToast(err.message || 'Failed to delete expense', 'error');
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Expenses</h1>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Add Expense
          </button>
        </div>
      </div>

      <div className="glass-card mb-4" style={{ padding: 'var(--space-md)', display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <Filter size={18} className="text-secondary" />
          <span className="text-secondary font-weight-500">Filters:</span>
        </div>
        
        <select 
          className="form-select" 
          style={{ width: 'auto', minWidth: '150px' }}
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        >
          <option value="">All Time</option>
          <option value={new Date().toISOString().substring(0, 7)}>This Month</option>
          {/* Add more month options based on available data if needed */}
        </select>

        <select 
          className="form-select"
          style={{ width: 'auto', minWidth: '150px' }}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        
        {(filterMonth || filterCategory) && (
          <button 
            className="btn btn--ghost text-secondary" 
            style={{ fontSize: '0.8125rem' }}
            onClick={() => { setFilterMonth(''); setFilterCategory(''); }}
          >
            Clear Filters
          </button>
        )}
      </div>

      <ExpenseList 
        expenses={filteredExpenses} 
        loading={loading} 
        onEdit={handleOpenModal}
        onDelete={handleDelete}
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
      >
        <ExpenseForm 
          initialData={editingExpense} 
          onSubmit={handleSubmit} 
          onCancel={handleCloseModal} 
        />
      </Modal>
    </div>
  );
};
