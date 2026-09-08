import { Router, Response } from 'express';
import { body } from 'express-validator';
import { prisma } from '../db/prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

const categoryRules = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('color').trim().notEmpty().withMessage('Color is required'),
  body('icon').trim().notEmpty().withMessage('Icon is required'),
  body('type').optional().isIn(['EXPENSE', 'INCOME']).withMessage('Invalid type')
];

// GET /api/categories
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { type } = req.query;

    const whereClause: any = {
      OR: [
        { userId: req.user.id },
        { userId: null }
      ]
    };

    if (type && ['EXPENSE', 'INCOME'].includes(String(type).toUpperCase())) {
      whereClause.type = String(type).toUpperCase();
    }

    // Fetch user categories + system default categories (where userId is null)
    let categories = await prisma.category.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });

    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/categories
router.post('/', authenticate, categoryRules, validate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { name, color, icon, type = 'EXPENSE' } = req.body;

    const existing = await prisma.category.findFirst({
      where: { name, userId: req.user.id }
    });
    if (existing) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const category = await prisma.category.create({
      data: {
        userId: req.user.id,
        name,
        color,
        icon,
        type
      }
    });

    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id
router.put('/:id', authenticate, categoryRules, validate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { name, color, icon, type = 'EXPENSE' } = req.body;

    const category = await prisma.category.findFirst({
      where: { id: req.params.id as string, userId: req.user.id as string }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found or not editable' });
    }

    const updated = await prisma.category.update({
      where: { id: req.params.id as string },
      data: { name, color, icon, type }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const category = await prisma.category.findFirst({
      where: { id: req.params.id as string, userId: req.user.id as string }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found or cannot be deleted' });
    }

    // Protect against deletion if in use
    const transactionCount = await prisma.transaction.count({
      where: { categoryId: req.params.id as string }
    });
    const budgetCount = await prisma.budget.count({
      where: { categoryId: req.params.id as string }
    });

    if (transactionCount > 0 || budgetCount > 0) {
      return res.status(400).json({ error: 'Category is in use by transactions or budgets and cannot be deleted.' });
    }

    await prisma.category.delete({
      where: { id: req.params.id as string }
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
