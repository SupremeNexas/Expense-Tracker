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

const cardRules = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('limit_amount').isFloat({ min: 0 }).withMessage('Valid limit required'),
  body('total_due').optional().isFloat({ min: 0 }),
  body('minimum_due').optional().isFloat({ min: 0 }),
  body('due_date').isISO8601().withMessage('Valid date required'),
];

// GET /api/credit_cards
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const cards = await prisma.creditCard.findMany({
      where: { userId: req.user.id },
      orderBy: { dueDate: 'asc' }
    });

    const enhancedCards = cards.map(c => {
      const limit = Number(c.limitAmount);
      const totalDue = Number(c.totalDue);
      const usage = limit > 0 ? (totalDue / limit) * 100 : 0;
      
      let riskLevel = 'Low';
      if (usage > 30) riskLevel = 'Medium';
      if (usage > 70) riskLevel = 'High';

      const dueDays = Math.ceil((new Date(c.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: c.id,
        name: c.name,
        limit_amount: limit,
        total_due: totalDue,
        minimum_due: Number(c.minimumDue),
        due_date: c.dueDate,
        billing_cycle_start: c.billingCycleStart,
        billing_cycle_end: c.billingCycleEnd,
        usage_percentage: Math.round(usage),
        risk_level: riskLevel,
        days_until_due: dueDays
      };
    });

    res.json(enhancedCards);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

// POST /api/credit_cards
router.post('/', authenticate, cardRules, validate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { name, limit_amount, total_due = 0, minimum_due = 0, due_date, billing_cycle_start, billing_cycle_end } = req.body;

    const card = await prisma.creditCard.create({
      data: {
        userId: req.user.id,
        name,
        limitAmount: new Prisma.Decimal(Number(limit_amount)),
        totalDue: new Prisma.Decimal(Number(total_due)),
        minimumDue: new Prisma.Decimal(Number(minimum_due)),
        dueDate: new Date(due_date),
        billingCycleStart: billing_cycle_start ? parseInt(billing_cycle_start) : null,
        billingCycleEnd: billing_cycle_end ? parseInt(billing_cycle_end) : null,
      }
    });

    res.status(201).json({
      id: card.id,
      name: card.name,
      limit_amount: Number(card.limitAmount),
      total_due: Number(card.totalDue),
      minimum_due: Number(card.minimumDue),
      due_date: card.dueDate,
      billing_cycle_start: card.billingCycleStart,
      billing_cycle_end: card.billingCycleEnd
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create card' });
  }
});

// PUT /api/credit_cards/:id
router.put('/:id', authenticate, cardRules, validate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { name, limit_amount, total_due, minimum_due, due_date, billing_cycle_start, billing_cycle_end } = req.body;

    const existing = await prisma.creditCard.findFirst({
      where: { id: req.params.id as string, userId: req.user.id as string }
    });

    if (!existing) return res.status(404).json({ error: 'Credit card not found' });

    const card = await prisma.creditCard.update({
      where: { id: req.params.id as string },
      data: {
        name,
        limitAmount: new Prisma.Decimal(Number(limit_amount)),
        totalDue: new Prisma.Decimal(Number(total_due)),
        minimumDue: new Prisma.Decimal(Number(minimum_due)),
        dueDate: new Date(due_date),
        billingCycleStart: billing_cycle_start ? parseInt(billing_cycle_start) : null,
        billingCycleEnd: billing_cycle_end ? parseInt(billing_cycle_end) : null,
      }
    });

    res.json({
      id: card.id,
      name: card.name,
      limit_amount: Number(card.limitAmount),
      total_due: Number(card.totalDue),
      minimum_due: Number(card.minimumDue),
      due_date: card.dueDate,
      billing_cycle_start: card.billingCycleStart,
      billing_cycle_end: card.billingCycleEnd
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update card' });
  }
});

// DELETE /api/credit_cards/:id
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const card = await prisma.creditCard.findFirst({
      where: { id: req.params.id as string, userId: req.user.id as string }
    });

    if (!card) return res.status(404).json({ error: 'Credit card not found' });

    await prisma.creditCard.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

export default router;
