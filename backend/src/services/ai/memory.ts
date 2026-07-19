import { prisma } from '../../db/prisma';

export interface UserMemoryProfile {
  favoritePaymentMethod: string;
  commonMerchants: { merchant: string; preferredCategory: string }[];
}

/**
 * Dynamically extract a user's spending memory profile from past transactions
 */
export async function getUserMemoryProfile(userId: string): Promise<UserMemoryProfile> {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: 'desc' },
      take: 200
    });

    const merchantCategories: Record<string, { category: string; count: number }> = {};
    const paymentMethodCounts: Record<string, number> = {};

    for (const t of transactions) {
      // Standardize title for merchant name detection
      const merchant = t.title.replace(/^receipt:\s*/i, '').trim();
      const mKey = merchant.toLowerCase();

      if (mKey.length < 2) continue;

      // Map merchant to category
      if (!merchantCategories[mKey]) {
        merchantCategories[mKey] = { category: t.category.name, count: 0 };
      }
      merchantCategories[mKey].count++;

      // Track payment methods
      if (t.paymentMethod) {
        paymentMethodCounts[t.paymentMethod] = (paymentMethodCounts[t.paymentMethod] || 0) + 1;
      }
    }

    // Get favorite payment method
    let favoritePaymentMethod = 'UPI';
    let maxPMCount = 0;
    for (const [pm, count] of Object.entries(paymentMethodCounts)) {
      if (count > maxPMCount) {
        favoritePaymentMethod = pm;
        maxPMCount = count;
      }
    }

    // Filter to merchants seen at least twice
    const commonMerchants = Object.entries(merchantCategories)
      .filter(([_, data]) => data.count >= 2)
      .map(([mKey, data]) => ({
        merchant: mKey,
        preferredCategory: data.category
      }));

    return {
      favoritePaymentMethod,
      commonMerchants
    };
  } catch (err) {
    console.error('Error fetching user memory profile:', err);
    return {
      favoritePaymentMethod: 'UPI',
      commonMerchants: []
    };
  }
}
