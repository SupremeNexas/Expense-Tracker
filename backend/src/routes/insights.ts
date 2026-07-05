import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user.id;
    const insights = [];

    // 1. Check active subscriptions cost
    const subscriptions = await prisma.subscription.findMany({
      where: { userId, isActive: true }
    });

    if (subscriptions.length > 0) {
      const totalCost = subscriptions.reduce((sum, s) => sum + Number(s.amount), 0);
      insights.push({
        type: 'subscription',
        title: 'Active Subscriptions',
        message: `You have ${subscriptions.length} active subscriptions costing INR ${totalCost.toFixed(2)} per cycle. Consider reviewing them for recurring leakages.`,
        actionUrl: '/subscriptions'
      });
    }

    // 2. Spending trend (current month vs last month)
    const now = new Date();
    const currStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const currSpentAgg = await prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE', date: { gte: currStart, lte: currEnd } },
      _sum: { amount: true }
    });

    const prevSpentAgg = await prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE', date: { gte: prevStart, lte: prevEnd } },
      _sum: { amount: true }
    });

    const currSpent = Number(currSpentAgg._sum.amount || 0);
    const prevSpent = Number(prevSpentAgg._sum.amount || 0);

    if (prevSpent > 0) {
      const diff = ((currSpent - prevSpent) / prevSpent) * 100;
      if (diff > 20) {
        insights.push({
          type: 'danger',
          title: 'High Spending Alert',
          message: `Your spending this month is ${diff.toFixed(0)}% higher than last month.`,
          actionUrl: '/analytics'
        });
      } else if (diff < -10) {
        insights.push({
          type: 'success',
          title: 'Great Job Saving!',
          message: `Your spending is ${Math.abs(diff).toFixed(0)}% lower than last month.`,
          actionUrl: '/analytics'
        });
      }
    }

    // 3. Credit Card alerts (due within 5 days)
    const cards = await prisma.creditCard.findMany({
      where: { userId }
    });

    for (const card of cards) {
      const dueDays = Math.ceil((new Date(card.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (dueDays >= 0 && dueDays <= 5) {
        insights.push({
          type: 'danger',
          title: 'Credit Card Due Soon',
          message: `Your ${card.name} card payment of INR ${Number(card.totalDue).toFixed(2)} is due in ${dueDays} days. Pay now to avoid interest.`,
          actionUrl: '/credit-cards'
        });
      }
    }

    // 4. Overspent budget check
    const budgets = await prisma.budget.findMany({
      where: { userId, startDate: { gte: currStart }, endDate: { lte: currEnd } },
      include: { category: true }
    });

    for (const budget of budgets) {
      const expenseSum = await prisma.transaction.aggregate({
        where: { userId, categoryId: budget.categoryId, type: 'EXPENSE', date: { gte: currStart, lte: currEnd } },
        _sum: { amount: true }
      });
      const spent = Number(expenseSum._sum.amount || 0);
      const limit = Number(budget.amount);
      if (spent > limit) {
        insights.push({
          type: 'danger',
          title: 'Budget Exceeded',
          message: `You have exceeded your ${budget.category.name} budget. Limit: INR ${limit}, Spent: INR ${spent}`,
          actionUrl: '/budgets'
        });
      }
    }

    res.json(insights);
  } catch (err) {
    console.error('Error fetching insights:', err);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

export default router;
