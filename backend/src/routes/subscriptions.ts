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

const subRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('cost').isFloat({ min: 0 }).withMessage('Cost must be positive'),
  body('billing_cycle').isIn(['monthly', 'yearly', 'MONTHLY', 'YEARLY']).withMessage('Must be monthly or yearly'),
  body('renewal_date').isISO8601().withMessage('Valid date required'),
];

// Helper to map DB Subscription to frontend structure
function mapSubscription(s: any) {
  return {
    id: s.id,
    name: s.name,
    cost: Number(s.amount),
    billing_cycle: s.billingCycle.toLowerCase(),
    renewal_date: s.nextBillingDate,
    is_active: s.isActive,
    payment_source: 'Primary Card'
  };
}

// GET /api/subscriptions
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const subs = await prisma.subscription.findMany({
      where: { userId: req.user.id },
      orderBy: { nextBillingDate: 'asc' }
    });

    res.json(subs.map(mapSubscription));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// POST /api/subscriptions
router.post('/', authenticate, subRules, validate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { name, cost, billing_cycle, renewal_date, is_active = true } = req.body;

    const sub = await prisma.subscription.create({
      data: {
        userId: req.user.id,
        name,
        amount: new Prisma.Decimal(Number(cost)),
        billingCycle: billing_cycle.toUpperCase(),
        nextBillingDate: new Date(renewal_date),
        isActive: !!is_active
      }
    });

    res.status(201).json(mapSubscription(sub));
  } catch (err) {
    console.error('Error creating subscription:', err);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// PUT /api/subscriptions/:id
router.put('/:id', authenticate, subRules, validate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { name, cost, billing_cycle, renewal_date, is_active } = req.body;

    const existing = await prisma.subscription.findFirst({
      where: { id: req.params.id as string, userId: req.user.id as string }
    });

    if (!existing) return res.status(404).json({ error: 'Subscription not found' });

    const updated = await prisma.subscription.update({
      where: { id: req.params.id as string },
      data: {
        name,
        amount: new Prisma.Decimal(Number(cost)),
        billingCycle: billing_cycle.toUpperCase(),
        nextBillingDate: new Date(renewal_date),
        isActive: !!is_active
      }
    });

    res.json(mapSubscription(updated));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// DELETE /api/subscriptions/:id
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const existing = await prisma.subscription.findFirst({
      where: { id: req.params.id as string, userId: req.user.id as string }
    });

    if (!existing) return res.status(404).json({ error: 'Subscription not found' });

    await prisma.subscription.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
});

export default router;
