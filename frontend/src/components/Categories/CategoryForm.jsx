import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import './CategoryManager.css'; // Reuse some grid classes

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

export const CategoryForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    color: PRESET_COLORS[0],
    icon: 'Tag'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        color: initialData.color,
        icon: initialData.icon
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Category name is required';
    if (!formData.color.match(/^#[0-9A-Fa-f]{6}$/)) newErrors.color = 'Valid color hex required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const SelectedIcon = Icons[formData.icon] || Icons.Tag;

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group mb-4">
        <label htmlFor="name" className="form-label">Category Name</label>
        <input
          type="text"
          id="name"
          name="name"
          className="form-input"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Travel"
          autoFocus
        />
        {errors.name && <div className="form-error">{errors.name}</div>}
      </div>

      <div className="form-group mb-4">
        <label className="form-label">Color</label>
        <div className="color-picker" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {PRESET_COLORS.map(color => (
            <div 
              key={color}
              onClick={() => setFormData(prev => ({ ...prev, color }))}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: color,
                cursor: 'pointer',
                border: formData.color === color ? '3px solid white' : '3px solid transparent',
                boxShadow: formData.color === color ? `0 0 0 2px ${color}` : 'none',
                transition: 'all 0.2s'
              }}
            />
          ))}
        </div>
      </div>

      <div className="form-group mb-6">
        <label className="form-label">Icon</label>
        <div className="icon-selector">
          <button 
            type="button" 
            className="selected-icon-btn btn btn--secondary"
            onClick={() => setShowIconPicker(!showIconPicker)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <SelectedIcon size={20} />
            <span>Change Icon</span>
          </button>
          
          {showIconPicker && (
            <div 
              className="icon-grid glass-card" 
              style={{ 
                marginTop: '8px', 
                padding: '12px', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', 
                gap: '8px' 
              }}
            >
              {AVAILABLE_ICONS.map(iconName => {
                const IconComp = Icons[iconName];
                return (
                  <div 
                    key={iconName}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, icon: iconName }));
                      setShowIconPicker(false);
                    }}
                    style={{
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: formData.icon === iconName ? 'var(--bg-input-focus)' : 'transparent',
                      color: formData.icon === iconName ? 'var(--accent-teal)' : 'var(--text-secondary)'
                    }}
                  >
                    <IconComp size={20} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="form-row">
        <button 
          type="button" 
          className="btn btn--secondary" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn btn--primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Category' : 'Create Category')}
        </button>
      </div>
    </form>
  );
};
