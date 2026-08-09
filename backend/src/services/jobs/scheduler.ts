import { prisma } from '../../db/prisma';

/**
 * Periodically processes background accounting checks (simulating a cron runner)
 */
export async function runSchedulerIntervalChecks(): Promise<void> {
  try {
    console.log('⏰ Running scheduled background jobs checklist...');

    const now = new Date();

    // 1. Roll over monthly budgets (if first day of month)
    if (now.getDate() === 1) {
      console.log('Rollover: Resetting budget intervals...');
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      await prisma.budget.updateMany({
        where: { period: 'MONTHLY' },
        data: {
          startDate: startOfMonth,
          endDate: endOfMonth
        }
      });
    }

    // 2. Auto-generate transactions for active subscriptions due today
    const activeSubs = await prisma.subscription.findMany({
      where: {
        isActive: true,
        nextBillingDate: { lte: now }
      }
    });

    for (const sub of activeSubs) {
      console.log(`Auto-logging recurring transaction for subscription: ${sub.name}`);

      // Resolve category and wallet link parameters
      const catId = sub.categoryId || (await prisma.category.findFirst({
        where: {
          name: 'Other',
          OR: [
            { userId: sub.userId },
            { workspaceId: sub.workspaceId }
          ]
        }
      }))?.id || (await prisma.category.findFirst({
        where: {
          workspaceId: sub.workspaceId
        }
      }))?.id;

      const walletId = sub.walletId || (await prisma.wallet.findFirst({
        where: {
          userId: sub.userId,
          workspaceId: sub.workspaceId
        }
      }))?.id;

      if (catId && walletId) {
        // Create actual transaction
        await prisma.transaction.create({
          data: {
            userId: sub.userId,
            workspaceId: sub.workspaceId,
            title: `Recurring: ${sub.name}`,
            amount: sub.amount,
            type: 'EXPENSE',
            categoryId: catId,
            walletId,
            paymentMethod: 'Auto-Debit',
            tags: ['recurring', 'subscription'],
            date: now
          }
        });

        // Decrement wallet balance
        await prisma.wallet.update({
          where: { id: walletId },
          data: { balance: { decrement: sub.amount } }
        });

        // Roll over billing date
        const nextDate = new Date(sub.nextBillingDate);
        if (sub.billingCycle === 'YEARLY') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        } else {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }

        await prisma.subscription.update({
          where: { id: sub.id },
          data: { nextBillingDate: nextDate }
        });
      }
    }

    console.log('✅ Background jobs finished checking.');
  } catch (err) {
    console.error('Scheduler failed during background check:', err);
  }
}

/**
 * Initializes background cron schedule interval
 */
export function startSchedulerJobs(intervalMs: number = 60 * 60 * 1000): NodeJS.Timeout {
  console.log('🚀 Background scheduler active.');
  
  // Run checks immediately on startup
  runSchedulerIntervalChecks();
  
  // Schedule recurring checks
  return setInterval(() => {
    runSchedulerIntervalChecks();
  }, intervalMs);
}
