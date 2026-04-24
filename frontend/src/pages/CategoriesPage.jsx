import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { api } from '../api/client';
import { CategoryManager } from '../components/Categories/CategoryManager';
import { CategoryForm } from '../components/Categories/CategoryForm';
import { Modal } from '../components/UI/Modal';
import { useToast } from '../components/UI/Toast';

export const CategoriesPage = () => {
  const { categories, loading, refreshData } = useAppContext();
  const { showToast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const handleOpenModal = (category = null) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingCategory(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (data) => {
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, data);
        showToast('Category updated successfully', 'success');
      } else {
        await api.createCategory(data);
        showToast('Category created successfully', 'success');
      }
      handleCloseModal();
      refreshData();
    } catch (err) {
      showToast(err.message || 'Failed to save category', 'error');
    }
  };

  const handleDelete = async (category) => {
    if (category.expense_count > 0) {
      showToast(`Cannot delete category with ${category.expense_count} existing expenses.`, 'warning');
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        await api.deleteCategory(category.id);
        showToast('Category deleted successfully', 'success');
        refreshData();
      } catch (err) {
        showToast(err.message || 'Failed to delete category', 'error');
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p className="text-secondary mt-1">Manage categories to organize your expenses and budgets.</p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Add Category
          </button>
        </div>
      </div>

      <CategoryManager 
        categories={categories} 
        loading={loading}
        onAdd={() => handleOpenModal()}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
      >
        <CategoryForm 
          initialData={editingCategory} 
          onSubmit={handleSubmit} 
          onCancel={handleCloseModal} 
        />
      </Modal>
    </div>
  );
};
