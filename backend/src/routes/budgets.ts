import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../db/prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { Prisma } from '@prisma/client';

const router = Router();

const validate = (req: any, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  next();
};

const budgetRules = [
  body('category_id').notEmpty().withMessage('Category is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2020, max: 2100 }).withMessage('Year must be between 2020 and 2100'),
  body('period').optional().isIn(['MONTHLY', 'WEEKLY', 'monthly', 'weekly']),
];

// GET /api/budgets
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { month, year } = req.query;

    const now = new Date();
    const filterMonth = month ? parseInt(month as string) : now.getMonth() + 1;
    const filterYear = year ? parseInt(year as string) : now.getFullYear();

    const start = new Date(filterYear, filterMonth - 1, 1);
    const end = new Date(filterYear, filterMonth, 0, 23, 59, 59);

    const budgets = await prisma.budget.findMany({
      where: {
        userId: req.user.id,
        startDate: { gte: start },
        endDate: { lte: end }
      },
      include: { category: true }
    });

    const result = await Promise.all(budgets.map(async (b) => {
      // Calculate spent amount
      const spentSum = await prisma.transaction.aggregate({
        where: {
          userId: req.user!.id,
          categoryId: b.categoryId,
          type: 'EXPENSE',
          date: { gte: b.startDate, lte: b.endDate }
        },
        _sum: { amount: true }
      });

      return {
        id: b.id,
        category_id: b.categoryId,
        category_name: b.category.name,
        category_color: b.category.color,
        category_icon: b.category.icon,
        amount: Number(b.amount),
        period: b.period.toLowerCase(),
        month: filterMonth,
        year: filterYear,
        spent: Number(spentSum._sum.amount || 0)
      };
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching budgets:', err);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// POST /api/budgets
router.post('/', authenticate, budgetRules, validate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { category_id, amount, month, year, period = 'MONTHLY' } = req.body;

    const category = await prisma.category.findFirst({
      where: {
        id: category_id,
        OR: [{ userId: req.user.id }, { userId: null }]
      }
    });

    if (!category) {
      return res.status(400).json({ error: 'Category not found' });
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    // Upsert budget using findFirst / update or create
    const existing = await prisma.budget.findFirst({
      where: {
        userId: req.user.id,
        categoryId: category_id,
        startDate: start,
        endDate: end
      }
    });

    let budget;
    if (existing) {
      budget = await prisma.budget.update({
        where: { id: existing.id },
        data: { amount: new Prisma.Decimal(Number(amount)), period: period.toUpperCase() },
        include: { category: true }
      });
    } else {
      budget = await prisma.budget.create({
        data: {
          userId: req.user.id,
          categoryId: category_id,
          amount: new Prisma.Decimal(Number(amount)),
          period: period.toUpperCase(),
          startDate: start,
          endDate: end
        },
        include: { category: true }
      });
    }

    const spentSum = await prisma.transaction.aggregate({
      where: {
        userId: req.user.id,
        categoryId: category_id,
        type: 'EXPENSE',
        date: { gte: start, lte: end }
      },
      _sum: { amount: true }
    });

    res.status(201).json({
      id: budget.id,
      category_id: budget.categoryId,
      category_name: budget.category.name,
      category_color: budget.category.color,
      category_icon: budget.category.icon,
      amount: Number(budget.amount),
      period: budget.period.toLowerCase(),
      month,
      year,
      spent: Number(spentSum._sum.amount || 0)
    });
  } catch (err) {
    console.error('Error creating budget:', err);
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const budget = await prisma.budget.findFirst({
      where: { id: req.params.id as string, userId: req.user.id as string }
    });

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    await prisma.budget.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Budget deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

export default router;
