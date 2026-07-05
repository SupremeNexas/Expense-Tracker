export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' }
];

export const formatCurrency = (amount: number, currencyCode?: string) => {
  const code = currencyCode || 'INR';
  try {
    const localeMap: { [key: string]: string } = {
      USD: 'en-US',
      EUR: 'de-DE',
      GBP: 'en-GB',
      INR: 'en-IN',
      JPY: 'ja-JP',
      CAD: 'en-CA',
      AUD: 'en-AU'
    };
    return new Intl.NumberFormat(localeMap[code] || 'en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (err) {
    const symbol = SUPPORTED_CURRENCIES.find(c => c.code === code)?.symbol || '$';
    return `${symbol}${Number(amount).toFixed(2)}`;
  }
};
