import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../api/client';
import { BudgetManager } from '../components/Budgets/BudgetManager';
import { BudgetForm } from '../components/Budgets/BudgetForm';
import { Modal } from '../components/UI/Modal';
import { useToast } from '../components/UI/Toast';

export const BudgetsPage = () => {
  const { showToast } = useToast();
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const data = await api.getBudgets({ month, year });
      setBudgets(data);
    } catch (err) {
      showToast('Failed to load budgets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const handleMonthChange = (newMonth, newYear) => {
    setMonth(newMonth);
    setYear(newYear);
  };

  const handleOpenModal = (budget = null) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingBudget(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (data) => {
    try {
      await api.createBudget(data);
      showToast(editingBudget ? 'Budget updated successfully' : 'Budget created successfully', 'success');
      handleCloseModal();
      fetchBudgets();
    } catch (err) {
      showToast(err.message || 'Failed to save budget', 'error');
    }
  };

  const handleDelete = async (budget) => {
    if (window.confirm(`Are you sure you want to delete this budget?`)) {
      try {
        await api.deleteBudget(budget.id);
        showToast('Budget deleted successfully', 'success');
        fetchBudgets();
      } catch (err) {
        showToast(err.message || 'Failed to delete budget', 'error');
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Budgets</h1>
          <p className="text-secondary mt-1">Set monthly limits to keep your spending on track.</p>
        </div>
      </div>

      <BudgetManager 
        budgets={budgets} 
        loading={loading}
        month={month}
        year={year}
        onMonthChange={handleMonthChange}
        onAdd={() => handleOpenModal()}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title={editingBudget ? 'Edit Budget' : 'Create Budget'}
      >
        <BudgetForm 
          initialData={editingBudget} 
          month={month}
          year={year}
          onSubmit={handleSubmit} 
          onCancel={handleCloseModal} 
        />
      </Modal>
    </div>
  );
};
