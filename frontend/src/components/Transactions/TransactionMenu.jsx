import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useToast } from '../UI/Toast';
import StaggeredMenu from '../StaggeredMenu/StaggeredMenu';
import Modal from '../UI/Modal';
import ExpenseForm from '../Expenses/ExpenseForm';
import { useNavigate, useLocation } from 'react-router-dom';

export default function TransactionMenu() {
  const [modalType, setModalType] = useState(null); // 'EXPENSE', 'INCOME', 'RECEIPT'
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const location = useLocation();

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

  const getMenuItems = () => {
    const path = location.pathname;
    switch (path) {
      case '/expenses':
        return [
          {
            label: 'Add Expense',
            ariaLabel: 'Add Expense',
            link: '#',
            onClick: (e) => {
              e.preventDefault();
              handleOpen('EXPENSE');
            }
          },
          {
            label: 'Add Income',
            ariaLabel: 'Add Income',
            link: '#',
            onClick: (e) => {
              e.preventDefault();
              handleOpen('INCOME');
            }
          },
          {
            label: 'Add Recurring',
            ariaLabel: 'Add Recurring Expense',
            link: '#',
            onClick: (e) => {
              e.preventDefault();
              handleOpen('EXPENSE');
            }
          },
          {
            label: 'Scan Receipt',
            ariaLabel: 'Scan Receipt',
            link: '#',
            onClick: (e) => {
              e.preventDefault();
              showToast('Receipt scanner starting (mock)...', 'info');
            }
          }
        ];
      case '/subscriptions':
        return [
          {
            label: 'Add Subscription',
            ariaLabel: 'Add Subscription',
            link: '#',
            onClick: (e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('open-add-subscription'));
            }
          }
        ];
      case '/credit-cards':
        return [
          {
            label: 'Add Credit Card',
            ariaLabel: 'Add Credit Card',
            link: '#',
            onClick: (e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('open-add-card'));
            }
          }
        ];
      case '/bills':
        return [
          {
            label: 'Add Utility Bill',
            ariaLabel: 'Add Utility Bill',
            link: '#',
            onClick: (e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('open-add-bill'));
            }
          }
        ];
      case '/groups':
        return [
          {
            label: 'Create New Group',
            ariaLabel: 'Create New Group',
            link: '#',
            onClick: (e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('open-add-group'));
            }
          }
        ];
      case '/friends':
        return [
          {
            label: 'Add Friend',
            ariaLabel: 'Add Friend',
            link: '#',
            onClick: (e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('open-add-friend'));
            }
          }
        ];
      case '/budgets':
        return [
          {
            label: 'Add Budget Limit',
            ariaLabel: 'Add Budget Limit',
            link: '#',
            onClick: (e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('open-add-budget'));
            }
          }
        ];
      case '/categories':
        return [
          {
            label: 'Add Category',
            ariaLabel: 'Add Category',
            link: '#',
            onClick: (e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('open-add-category'));
            }
          }
        ];
      default:
        return [
          {
            label: 'Add Expense',
            ariaLabel: 'Add Expense',
            link: '#',
            onClick: (e) => {
              e.preventDefault();
              handleOpen('EXPENSE');
            }
          },
          {
            label: 'Add Income',
            ariaLabel: 'Add Income',
            link: '#',
            onClick: (e) => {
              e.preventDefault();
              handleOpen('INCOME');
            }
          },
          {
            label: 'Scan Receipt',
            ariaLabel: 'Scan Receipt',
            link: '#',
            onClick: (e) => {
              e.preventDefault();
              showToast('Receipt scanner starting (mock)...', 'info');
            }
          }
        ];
    }
  };

  const menuItems = getMenuItems();

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
