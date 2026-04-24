import React, { useState } from 'react';
import { SUPPORTED_CURRENCIES } from '../../utils/currency';
import { useAppContext } from '../../context/AppContext';

export const CurrencySelector = () => {
  const { user, updateUserCurrency } = useAppContext();
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleChange = async (e) => {
    setLoading(true);
    try {
      await updateUserCurrency(e.target.value);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <select 
      className="form-select" 
      style={{ 
        padding: '6px 12px', 
        fontSize: '0.8125rem', 
        width: 'auto', 
        background: 'var(--bg-input)',
        border: '1px solid var(--glass-border)',
        opacity: loading ? 0.5 : 1
      }}
      value={user.base_currency || 'USD'}
      onChange={handleChange}
      disabled={loading}
    >
      {SUPPORTED_CURRENCIES.map(c => (
        <option key={c.code} value={c.code}>
          {c.code} ({c.symbol})
        </option>
      ))}
    </select>
  );
};
