import React, { useState } from 'react';
import { CreditCard, Eye, EyeOff } from 'lucide-react';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';

interface CreditCardFormProps {
  onSubmit: (data: {
    name: string;
    limit_amount: number;
    due_date: string;
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
  }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CreditCardForm({ onSubmit, onCancel, isSubmitting = false }: CreditCardFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    limit_amount: '',
    due_date: new Date().toISOString().substring(0, 10),
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  const [showCardNumber, setShowCardNumber] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Format card number with spaces every 4 digits
    if (name === 'cardNumber') {
      const cleanValue = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      const matches = cleanValue.match(/\d{4,16}/g);
      const match = (matches && matches[0]) || '';
      const parts = [];

      for (let i = 0, len = match.length; i < len; i += 4) {
        parts.push(match.substring(i, i + 4));
      }

      if (parts.length > 0) {
        setFormData(prev => ({ ...prev, cardNumber: parts.join(' ') }));
      } else {
        setFormData(prev => ({ ...prev, cardNumber: cleanValue }));
      }
      return;
    }

    // Format Expiry Date as MM/YY
    if (name === 'expiryDate') {
      const cleanValue = value.replace(/\//g, '').replace(/[^0-9]/gi, '');
      if (cleanValue.length <= 2) {
        setFormData(prev => ({ ...prev, expiryDate: cleanValue }));
      } else {
        setFormData(prev => ({ ...prev, expiryDate: `${cleanValue.slice(0, 2)}/${cleanValue.slice(2, 4)}` }));
      }
      return;
    }

    // CVV limit of 3 digits
    if (name === 'cvv') {
      const cleanValue = value.replace(/[^0-9]/gi, '');
      setFormData(prev => ({ ...prev, cvv: cleanValue.slice(0, 3) }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      limit_amount: parseFloat(formData.limit_amount)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-sans text-text max-w-full">
      {/* Header Info */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight">New Credit Card</h3>
          <p className="text-xs text-muted">Manage your credit cards, limits, and billing cycles.</p>
        </div>
      </div>

      {/* Section 1: Basic Information */}
      <div className="space-y-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 font-sans">
          Basic Information
        </div>

        <Input
          label="Card Name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Sapphire Preferred, Apple Card"
          required
          autoFocus
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Credit Limit"
            type="number"
            name="limit_amount"
            value={formData.limit_amount}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            icon={<span className="text-sm font-semibold text-gray-400 dark:text-gray-500">₹</span>}
            required
          />

          <Input
            label="Next Due Date"
            type="date"
            name="due_date"
            value={formData.due_date}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {/* Section 2: Card Credentials for 3D View */}
      <div className="space-y-4 pt-2">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 font-sans">
          Card Credentials (Local Display)
        </div>

        <div className="relative">
          <Input
            label="Card Number"
            type={showCardNumber ? "text" : "password"}
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleChange}
            placeholder="•••• •••• •••• ••••"
            maxLength={19}
            required
          />
          <button
            type="button"
            onClick={() => setShowCardNumber(!showCardNumber)}
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            {showCardNumber ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Expiry Date"
            type="text"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            placeholder="MM/YY"
            maxLength={5}
            required
          />

          <Input
            label="CVV"
            type="password"
            name="cvv"
            value={formData.cvv}
            onChange={handleChange}
            placeholder="•••"
            maxLength={3}
            required
          />
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
          Save Credit Card
        </Button>
      </div>
    </form>
  );
}

export default CreditCardForm;
