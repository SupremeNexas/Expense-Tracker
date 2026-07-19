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

// Global active provider instance
let activeRatesProvider: ExchangeRateProvider = new LocalRateProvider();

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
  try {
    return await activeRatesProvider.getRates(base);
  } catch (err) {
    console.error('Failed to load exchange rates list:', err);
    return { [base.toUpperCase()]: 1.0 };
  }
}
