import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { Tag, HelpCircle } from 'lucide-react';

const PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#A78BFA',
  '#FBBF24', '#F87171', '#60A5FA', '#34D399',
  '#B8B8B8', '#10B981', '#6366F1', '#EC4899'
];

const AVAILABLE_ICONS = [
  'Tag', 'Coffee', 'Utensils', 'Car', 'Home', 'ShoppingBag', 
  'Smartphone', 'Monitor', 'Film', 'Music', 'Heart', 'Book', 
  'Zap', 'Briefcase', 'Gift', 'Plane', 'MoreHorizontal'
];

interface CategoryFormProps {
  initialData?: { name: string; color: string; icon: string; type?: 'EXPENSE' | 'INCOME' };
  onSubmit: (data: { name: string; color: string; icon: string; type: 'EXPENSE' | 'INCOME' }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CategoryForm({ initialData, onSubmit, onCancel, isSubmitting = false }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    color: PRESET_COLORS[0],
    icon: 'Tag',
    type: 'EXPENSE' as 'EXPENSE' | 'INCOME'
  });

  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        color: initialData.color,
        icon: initialData.icon,
        type: initialData.type || 'EXPENSE'
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSubmit(formData);
  };

  // Resolve current active icon
  const SelectedIcon = (Icons as any)[formData.icon] || Tag;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-sans text-black dark:text-white max-w-full">
      {/* Header Info */}
      <div className="flex items-center gap-3 pb-4 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
          <Tag className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold tracking-tight">
            {initialData ? 'Edit Category' : 'New Category'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Classify your transactions under personalized labels.</p>
        </div>
      </div>

      {/* Section 1: Basic Information */}
      <div className="space-y-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Category Details
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
            Category Name
          </label>
          <input 
            type="text" 
            name="name"
            className="w-full px-4 h-[56px] rounded-[18px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" 
            value={formData.name} 
            onChange={handleChange} 
            placeholder="e.g. Dining, Travel, Software"
            required 
            autoFocus
          />
        </div>

        {/* Type selector */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Type
          </label>
          <select 
            name="type"
            className="w-full px-4 h-[56px] rounded-[18px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23707070%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_16px_center] bg-no-repeat"
            value={formData.type} 
            onChange={handleChange}
          >
            <option value="EXPENSE">Expense (Debit)</option>
            <option value="INCOME">Income (Credit)</option>
          </select>
        </div>

        {/* Color Palette Grid */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Accent Color
          </label>
          <div className="grid grid-cols-8 gap-2.5 max-w-sm">
            {PRESET_COLORS.map(color => (
              <button 
                key={color}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, color }))}
                style={{ backgroundColor: color }}
                className={`w-8 h-8 rounded-full cursor-pointer transition-all duration-200 relative
                  ${formData.color === color ? 'scale-110 shadow-lg ring-4 ring-offset-2 ring-emerald-500/20 dark:ring-offset-neutral-900' : 'hover:scale-105'}
                `}
              />
            ))}
          </div>
        </div>

        {/* Icon Picker Block */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Category Icon
          </label>
          <div className="relative">
            <button 
              type="button" 
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.01] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] cursor-pointer text-sm transition-colors"
              onClick={() => setShowIconPicker(!showIconPicker)}
            >
              <SelectedIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <span className="font-medium text-gray-600 dark:text-gray-400">Change Label Icon</span>
            </button>
            
            {showIconPicker && (
              <div className="absolute z-20 mt-3 p-3 bg-white dark:bg-[#151515] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl shadow-xl grid grid-cols-6 gap-2 w-[280px]">
                {AVAILABLE_ICONS.map(iconName => {
                  const IconComp = (Icons as any)[iconName] || HelpCircle;
                  return (
                    <button 
                      key={iconName}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, icon: iconName }));
                        setShowIconPicker(false);
                      }}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl cursor-pointer transition-colors
                        ${formData.icon === iconName ? 'bg-emerald-500/10 text-emerald-500' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-gray-500'}
                      `}
                    >
                      <IconComp className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Action Bar */}
      <div className="flex justify-end gap-3 pt-6 border-t border-black/[0.04] dark:border-white/[0.04]">
        <button 
          type="button" 
          className="px-6 h-[48px] rounded-[14px] text-sm font-medium border border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] active:scale-[0.98] transition-all cursor-pointer text-gray-500 dark:text-gray-400" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="px-6 h-[48px] rounded-[14px] text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Category' : 'Create Category')}
        </button>
      </div>
    </form>
  );
}
export default CategoryForm;
