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

const goalRules = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('target_amount').isFloat({ min: 0.01 }).withMessage('Valid target required'),
  body('current_amount').optional().isFloat({ min: 0 }),
  body('deadline').isISO8601().withMessage('Valid date required'),
];

// Helper to map DB Goal to frontend structure
function mapGoal(g: any) {
  return {
    id: g.id,
    name: g.name,
    target_amount: Number(g.targetAmount),
    current_amount: Number(g.currentAmount),
    deadline: g.targetDate,
    contributions: g.contributions?.map((c: any) => ({
      id: c.id,
      amount: Number(c.amount),
      date: c.date,
      notes: c.notes
    })) || []
  };
}

// GET /api/goals
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const goals = await prisma.goal.findMany({
      where: { userId: req.user.id },
      include: { contributions: true },
      orderBy: { targetDate: 'asc' }
    });

    res.json(goals.map(mapGoal));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// POST /api/goals
router.post('/', authenticate, goalRules, validate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { name, target_amount, current_amount = 0, deadline } = req.body;

    const goal = await prisma.goal.create({
      data: {
        userId: req.user.id,
        name,
        targetAmount: new Prisma.Decimal(Number(target_amount)),
        currentAmount: new Prisma.Decimal(Number(current_amount)),
        targetDate: new Date(deadline),
      },
      include: { contributions: true }
    });

    res.status(201).json(mapGoal(goal));
  } catch (err) {
    console.error('Error creating goal:', err);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// PUT /api/goals/:id
router.put('/:id', authenticate, goalRules, validate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { name, target_amount, current_amount, deadline, contribution_amount, contribution_notes } = req.body;

    const existing = await prisma.goal.findFirst({
      where: { id: req.params.id as string, userId: req.user.id as string }
    });

    if (!existing) return res.status(404).json({ error: 'Goal not found' });

    // Handle adding a contribution if provided
    let newCurrentAmount = Number(current_amount);
    let contributionData = undefined;

    if (contribution_amount && Number(contribution_amount) > 0) {
      newCurrentAmount = Number(existing.currentAmount) + Number(contribution_amount);
      contributionData = {
        create: {
          amount: new Prisma.Decimal(Number(contribution_amount)),
          notes: contribution_notes || 'Contribution added',
          date: new Date()
        }
      };
    }

    const updated = await prisma.goal.update({
      where: { id: req.params.id as string },
      data: {
        name,
        targetAmount: new Prisma.Decimal(Number(target_amount)),
        currentAmount: new Prisma.Decimal(newCurrentAmount),
        targetDate: new Date(deadline),
        contributions: contributionData
      },
      include: { contributions: true }
    });

    res.json(mapGoal(updated));
  } catch (err) {
    console.error('Error updating goal:', err);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// DELETE /api/goals/:id
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const goal = await prisma.goal.findFirst({
      where: { id: req.params.id as string, userId: req.user.id as string }
    });

    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    await prisma.goal.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

export default router;
