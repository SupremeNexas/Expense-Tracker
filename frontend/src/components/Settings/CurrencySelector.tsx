import React, { useState } from 'react';
import { SUPPORTED_CURRENCIES } from '../../utils/currency';
import useAuthStore from '../../store/authStore';

export function CurrencySelector() {
  const { user, updateCurrency } = useAuthStore();
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLoading(true);
    try {
      await updateCurrency(e.target.value);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <select 
      className="input-premium py-1 px-3 text-xs w-auto cursor-pointer"
      value={user.baseCurrency || 'USD'}
      onChange={handleChange}
      disabled={loading}
      style={{ opacity: loading ? 0.5 : 1 }}
    >
      {SUPPORTED_CURRENCIES.map(c => (
        <option key={c.code} value={c.code}>
          {c.code} ({c.symbol})
        </option>
      ))}
    </select>
  );
}
export default CurrencySelector;
