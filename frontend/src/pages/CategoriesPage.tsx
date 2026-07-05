import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, Sparkles, Check } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/UI/Toast';
import Modal from '../components/UI/Modal';
import { Category } from '../types';
import { CategoryForm } from '../components/Categories/CategoryForm';

const COLOR_PRESETS = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#6B7280'  // Gray
];

const ICONS = ['ShoppingBag', 'Car', 'Flame', 'Coffee', 'Tv', 'TrendingUp', 'Heart', 'Book', 'HelpCircle'];

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Queries
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.getCategories()
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createCategory(data),
    onSuccess: () => {
      showToast('Category created successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsModalOpen(false);
      setEditingCategory(null);
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to create category', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateCategory(id, data),
    onSuccess: () => {
      showToast('Category updated successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsModalOpen(false);
      setEditingCategory(null);
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to update category', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCategory(id),
    onSuccess: () => {
      showToast('Category deleted successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to delete category', 'error');
    }
  });

  const handleOpenModal = (cat: Category | null = null) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (data: { name: string; color: string; icon: string; type: 'EXPENSE' | 'INCOME' }) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (cat: Category) => {
    if (window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      deleteMutation.mutate(cat.id);
    }
  };

  return (
    <div className="space-y-6 fade-in-up">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ledger Categories</h1>
          <p className="text-sm text-gray-400 mt-1">Classify and group your inflow/outflow transactions.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn-premium btn-premium-primary gap-2 cursor-pointer py-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Grid of Categories */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="premium-card h-28 animate-pulse border-black/[0.04] dark:border-white/[0.04] bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map(cat => (
            <div 
              key={cat.id} 
              className="premium-card flex flex-col justify-between border-black/[0.05] dark:border-white/[0.05] hover:border-black/10 dark:hover:border-white/10"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold truncate max-w-[120px]">{cat.name}</h3>
                    <span className="text-[10px] text-gray-400 capitalize">{cat.type.toLowerCase()}</span>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  <button 
                    onClick={() => handleOpenModal(cat)}
                    className="p-1 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(cat)}
                    className="p-1 rounded-lg hover:bg-red-500/10 text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between text-[10px] text-gray-400">
                <span className="font-mono">COLOR swatch: {cat.color}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Creation / Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        title=""
      >
        <CategoryForm 
          initialData={editingCategory ? {
            name: editingCategory.name,
            color: editingCategory.color,
            icon: editingCategory.icon || 'Tag',
            type: editingCategory.type
          } : undefined}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingCategory(null);
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>
    </div>
  );
}
