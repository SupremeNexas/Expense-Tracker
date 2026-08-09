import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useToast } from '../UI/Toast';
import StaggeredMenu from '../StaggeredMenu/StaggeredMenu';
import Modal from '../UI/Modal';
import ExpenseForm from '../Expenses/ExpenseForm';

export default function TransactionMenu() {
  const [modalType, setModalType] = useState(null); // 'EXPENSE', 'INCOME', 'RECEIPT'
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const handleOpen = (type) => {
    if (type === 'RECEIPT') {
      showToast('Receipt scanner starting (mock)...', 'info');
      // Here one might trigger the scanner UI.
      // We will just show toast for now or fall back.
      return;
    }
    setModalType(type);
  };

  const handleClose = () => {
    setModalType(null);
  };

  const createMutation = useMutation({
    mutationFn: (data) => api.createExpense(data),
    onSuccess: () => {
      showToast('Transaction added successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['trend'] });
      queryClient.invalidateQueries({ queryKey: ['categories-pie'] });
      handleClose();
    },
    onError: (err) => {
      showToast(err.message || 'Failed to add transaction', 'error');
    }
  });

  const handleSubmit = (data) => {
    createMutation.mutate({ ...data, type: modalType });
  };

  const menuItems = [
    { label: 'Add Expense', ariaLabel: 'Add Expense', link: '#', onClick: () => handleOpen('EXPENSE') },
    { label: 'Add Income', ariaLabel: 'Add Income', link: '#', onClick: () => handleOpen('INCOME') },
    { label: 'Scan Receipt', ariaLabel: 'Scan Receipt', link: '#', onClick: () => handleOpen('RECEIPT') },
  ];

  return (
    <>
      <StaggeredMenu
        isFixed
        position="right"
        items={menuItems}
        colors={['#17C964', '#0d7d3d']}
        menuButtonColor="#ffffff"
        openMenuButtonColor="#000000"
        accentColor="#17C964"
        displayItemNumbering={true}
        displaySocials={false}
      />

      <Modal
        isOpen={modalType === 'EXPENSE' || modalType === 'INCOME'}
        onClose={handleClose}
        title={modalType === 'EXPENSE' ? 'New Expense' : 'New Income'}
        description={`Record an ${modalType === 'EXPENSE' ? 'expense' : 'income'}.`}
        maxWidth="720px"
      >
        <ExpenseForm
          initialData={{ type: modalType }}
          onSubmit={handleSubmit}
          onCancel={handleClose}
        />
      </Modal>
    </>
  );
}
