import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { Tag, HelpCircle } from 'lucide-react';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { Button } from '../UI/Button';

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
    <form onSubmit={handleSubmit} className="space-y-6 font-sans text-text max-w-full">
      {/* Header Info */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
          <Tag className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight">
            {initialData ? 'Edit Category' : 'New Category'}
          </h3>
          <p className="text-xs text-muted">Classify your transactions under personalized labels.</p>
        </div>
      </div>

      {/* Section 1: Basic Information */}
      <div className="space-y-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 font-sans">
          Category Details
        </div>

        <Input
          label="Category Name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Dining, Travel, Software"
          required
          autoFocus
        />

        <Select
          label="Type"
          name="type"
          value={formData.type}
          onChange={handleChange}
        >
          <option value="EXPENSE">Expense (Debit)</option>
          <option value="INCOME">Income (Credit)</option>
        </Select>

        {/* Color Palette Grid */}
        <div className="flex flex-col text-left">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 font-sans">
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
        <div className="flex flex-col text-left">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 font-sans">
            Category Icon
          </label>
          <div className="relative">
            <button 
              type="button" 
              className="flex items-center gap-2.5 px-4 py-3 rounded-[14px] border border-border bg-black/[0.01] dark:bg-white/[0.01] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] cursor-pointer text-sm transition-colors"
              onClick={() => setShowIconPicker(!showIconPicker)}
            >
              <SelectedIcon className="w-5 h-5 text-text" />
              <span className="font-medium text-gray-500">Change Label Icon</span>
            </button>
            
            {showIconPicker && (
              <div className="absolute z-20 mt-3 p-3 bg-card border border-border rounded-2xl shadow-xl grid grid-cols-6 gap-2 w-[280px]">
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
      <div className="flex justify-end gap-3 pt-6 border-t border-border">
        <Button 
          type="button" 
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="primary"
          className="bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500/20"
          loading={isSubmitting}
        >
          {initialData ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}

export default CategoryForm;
