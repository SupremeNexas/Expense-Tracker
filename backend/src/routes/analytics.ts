import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { requireWorkspaceRole, WorkspaceRequest } from '../middleware/rbac';
import { Prisma } from '@prisma/client';

const router = Router();

// GET /api/analytics/summary - Workspace scoped spending & income summary
router.get('/summary', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']), async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });
    const { month, year } = req.query;

    const dateFilter: Prisma.DateTimeFilter = {};
    if (month && year) {
      const m = parseInt(month as string);
      const y = parseInt(year as string);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59);
      dateFilter.gte = start;
      dateFilter.lte = end;
    } else if (year) {
      const y = parseInt(year as string);
      const start = new Date(y, 0, 1);
      const end = new Date(y, 11, 31, 23, 59, 59);
      dateFilter.gte = start;
      dateFilter.lte = end;
    }

    const expenseWhereClause: Prisma.TransactionWhereInput = {
      workspaceId: req.workspaceId,
      type: 'EXPENSE',
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
    };

    const incomeWhereClause: Prisma.TransactionWhereInput = {
      workspaceId: req.workspaceId,
      type: 'INCOME',
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
    };

    const expenseSummary = await prisma.transaction.aggregate({
      where: expenseWhereClause,
      _sum: { amount: true },
      _count: { id: true },
      _avg: { amount: true }
    });

    const incomeSummary = await prisma.transaction.aggregate({
      where: incomeWhereClause,
      _sum: { amount: true },
      _count: { id: true },
      _avg: { amount: true }
    });

    const highestExpense = await prisma.transaction.findFirst({
      where: expenseWhereClause,
      include: { category: true },
      orderBy: { amount: 'desc' }
    });

    const highestIncome = await prisma.transaction.findFirst({
      where: incomeWhereClause,
      include: { category: true },
      orderBy: { amount: 'desc' }
    });

    const totalExpense = Math.round(Number(expenseSummary._sum.amount || 0) * 100) / 100;
    const totalIncome = Math.round(Number(incomeSummary._sum.amount || 0) * 100) / 100;

    res.json({
      total: totalExpense,
      totalExpenses: totalExpense,
      totalIncome: totalIncome,
      net: Math.round((totalIncome - totalExpense) * 100) / 100,
      count: (expenseSummary._count.id || 0) + (incomeSummary._count.id || 0),
      expenseCount: expenseSummary._count.id || 0,
      incomeCount: incomeSummary._count.id || 0,
      average: Math.round(Number(expenseSummary._avg.amount || 0) * 100) / 100,
      incomeAverage: Math.round(Number(incomeSummary._avg.amount || 0) * 100) / 100,
      highest: highestExpense ? {
        id: highestExpense.id,
        title: highestExpense.title,
        amount: Number(highestExpense.amount),
        date: highestExpense.date,
        category_name: highestExpense.category.name,
        category_color: highestExpense.category.color,
        category_icon: highestExpense.category.icon
      } : null,
      highestIncome: highestIncome ? {
        id: highestIncome.id,
        title: highestIncome.title,
        amount: Number(highestIncome.amount),
        date: highestIncome.date,
        category_name: highestIncome.category.name,
        category_color: highestIncome.category.color,
        category_icon: highestIncome.category.icon
      } : null
    });
  } catch (err) {
    console.error('Error fetching summary:', err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// GET /api/analytics/by-category
router.get('/by-category', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']), async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });
    const { month, year, type = 'EXPENSE' } = req.query;
    const targetType = String(type).toUpperCase() === 'INCOME' ? 'INCOME' : 'EXPENSE';

    const dateFilter: Prisma.TransactionWhereInput = {};
    if (month && year) {
      const m = parseInt(month as string);
      const y = parseInt(year as string);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59);
      dateFilter.date = { gte: start, lte: end };
    } else if (year) {
      const y = parseInt(year as string);
      const start = new Date(y, 0, 1);
      const end = new Date(y, 11, 31, 23, 59, 59);
      dateFilter.date = { gte: start, lte: end };
    }

    // Fetch system and workspace categories matching type
    const categories = await prisma.category.findMany({
      where: {
        type: targetType,
        OR: [
          { userId: req.user.id },
          { userId: null },
          { workspaceId: req.workspaceId }
        ]
      }
    });

    const breakdown = await Promise.all(categories.map(async (cat) => {
      const agg = await prisma.transaction.aggregate({
        where: {
          workspaceId: req.workspaceId,
          categoryId: cat.id,
          type: targetType,
          ...dateFilter
        },
        _sum: { amount: true },
        _count: { id: true }
      });

      return {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        total: Number(agg._sum.amount || 0),
        count: agg._count.id || 0
      };
    }));

    // Sort by total descending and filter out zero values to keep analytics clean
    breakdown.sort((a, b) => b.total - a.total);
    const activeBreakdown = breakdown.filter(b => b.total > 0);

    res.json(activeBreakdown.length > 0 ? activeBreakdown : breakdown.slice(0, 5));
  } catch (err) {
    console.error('Error fetching category breakdown:', err);
    res.status(500).json({ error: 'Failed to fetch category breakdown' });
  }
});

// GET /api/analytics/trend (6 months historical)
router.get('/trend', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']), async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });

    const trend = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });

      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59);

      // Sum Expenses
      const expenseAgg = await prisma.transaction.aggregate({
        where: {
          workspaceId: req.workspaceId,
          type: 'EXPENSE',
          date: { gte: start, lte: end }
        },
        _sum: { amount: true },
        _count: { id: true }
      });

      // Sum Incomes
      const incomeAgg = await prisma.transaction.aggregate({
        where: {
          workspaceId: req.workspaceId,
          type: 'INCOME',
          date: { gte: start, lte: end }
        },
        _sum: { amount: true },
        _count: { id: true }
      });

      const expTotal = Math.round(Number(expenseAgg._sum.amount || 0) * 100) / 100;
      const incTotal = Math.round(Number(incomeAgg._sum.amount || 0) * 100) / 100;

      trend.push({
        month: label,
        monthNum: m,
        year: y,
        total: expTotal,
        expense: expTotal,
        income: incTotal,
        net: Math.round((incTotal - expTotal) * 100) / 100,
        count: (expenseAgg._count.id || 0) + (incomeAgg._count.id || 0),
      });
    }

    res.json(trend);
  } catch (err) {
    console.error('Error fetching trend:', err);
    res.status(500).json({ error: 'Failed to fetch trend' });
  }
});

// GET /api/analytics/budget-status
router.get('/budget-status', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']), async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });

    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month as string) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const budgets = await prisma.budget.findMany({
      where: {
        workspaceId: req.workspaceId,
        startDate: { gte: start },
        endDate: { lte: end }
      },
      include: { category: true }
    });

    const result = await Promise.all(budgets.map(async (b) => {
      const expenseAgg = await prisma.transaction.aggregate({
        where: {
          workspaceId: req.workspaceId,
          categoryId: b.categoryId,
          type: 'EXPENSE',
          date: { gte: b.startDate, lte: b.endDate }
        },
        _sum: { amount: true }
      });

      const spent = Number(expenseAgg._sum.amount || 0);
      const amount = Number(b.amount);

      return {
        id: b.id,
        category_id: b.categoryId,
        category_name: b.category.name,
        category_color: b.category.color,
        category_icon: b.category.icon,
        amount,
        spent: Math.round(spent * 100) / 100,
        remaining: Math.round((amount - spent) * 100) / 100,
        percentage: amount > 0 ? Math.round((spent / amount) * 100) : 0,
        over_budget: spent > amount,
      };
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching budget status:', err);
    res.status(500).json({ error: 'Failed to fetch budget status' });
  }
});

export default router;
