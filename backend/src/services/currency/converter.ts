export interface ExchangeRateProvider {
  getRates(base: string): Promise<Record<string, number>>;
}

/**
 * High-fidelity realistic mock provider supporting offline operation with zero API rate blocks.
 */
class LocalRateProvider implements ExchangeRateProvider {
  // Mock exchange rates relative to USD
  private ratesMatrix: Record<string, number> = {
    USD: 1.0,
    INR: 83.5,
    EUR: 0.92,
    GBP: 0.78,
    JPY: 155.2,
    CAD: 1.36,
    AUD: 1.51,
    SGD: 1.35
  };

  async getRates(base: string): Promise<Record<string, number>> {
    const baseRate = this.ratesMatrix[base.toUpperCase()] || 1.0;
    const computedRates: Record<string, number> = {};

    // Remap rates relative to the requested base currency
    for (const [currency, usdRate] of Object.entries(this.ratesMatrix)) {
      computedRates[currency] = usdRate / baseRate;
    }

    return computedRates;
  }
}

/**
 * Live API exchange rates provider with caching and self-healing local fallback.
 */
class LiveExchangeRateProvider implements ExchangeRateProvider {
  private cache: Record<string, { rates: Record<string, number>; expiry: number }> = {};
  private fallbackProvider = new LocalRateProvider();
  private CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours caching to prevent API spam

  async getRates(base: string): Promise<Record<string, number>> {
    const formattedBase = base.toUpperCase();
    const now = Date.now();

    // Check cache
    if (this.cache[formattedBase] && this.cache[formattedBase].expiry > now) {
      return this.cache[formattedBase].rates;
    }

    try {
      console.log(`[Exchange Rates] Fetching live rates from open.er-api.com for base: ${formattedBase}...`);
      const response = await fetch(`https://open.er-api.com/v6/latest/${formattedBase}`);
      if (!response.ok) {
        throw new Error(`HTTP status code: ${response.status}`);
      }
      const data = (await response.json()) as any;
      if (data && data.result === 'success' && data.rates) {
        const rates = data.rates as Record<string, number>;
        this.cache[formattedBase] = {
          rates,
          expiry: now + this.CACHE_DURATION_MS
        };
        return rates;
      }
      throw new Error('API reported unsuccessful rate retrieval');
    } catch (err) {
      console.warn(`[Exchange Rates] Failed to fetch live rates for base ${formattedBase}:`, err, 'Falling back to local rate matrix.');
      // Fetch fallback matrix
      return this.fallbackProvider.getRates(formattedBase);
    }
  }
}

// Global active provider instance
let activeRatesProvider: ExchangeRateProvider = new LiveExchangeRateProvider();

export function setRatesProvider(provider: ExchangeRateProvider): void {
  activeRatesProvider = provider;
}

/**
 * Converts a numeric value between two currency codes
 */
export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Invalid amount provided for currency conversion');
  }
  if (!from || typeof from !== 'string' || !to || typeof to !== 'string') {
    throw new Error('From and to currency codes must be non-empty strings');
  }
  const fCode = from.toUpperCase();
  const tCode = to.toUpperCase();
  if (fCode === tCode) return amount;

  try {
    const rates = await activeRatesProvider.getRates(fCode);
    const multiplier = rates[tCode];
    if (!multiplier) {
      console.warn(`Exchange rate from ${fCode} to ${tCode} was not found. Returning original value.`);
      return amount;
    }
    return Number((amount * multiplier).toFixed(2));
  } catch (err) {
    console.error('Error during currency conversion:', err);
    return amount;
  }
}

/**
 * Returns complete rates list for a given base currency
 */
export async function getExchangeRates(base: string): Promise<Record<string, number>> {
  if (!base || typeof base !== 'string') {
    throw new Error('Base currency must be a valid non-empty string');
  }
  try {
    return await activeRatesProvider.getRates(base);
  } catch (err) {
    console.error('Failed to load exchange rates list:', err);
    return { [base.toUpperCase()]: 1.0 };
  }
}
