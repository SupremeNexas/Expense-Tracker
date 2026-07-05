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

const billRules = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount required'),
  body('due_date').isISO8601().withMessage('Valid date required'),
  body('status').isIn(['pending', 'paid', 'overdue']).withMessage('Invalid status')
];

// Helper to map DB Bill to frontend structure
function mapBill(b: any) {
  const isOverdue = !b.isPaid && new Date(b.dueDate).getTime() < new Date().getTime();
  const status = b.isPaid ? 'paid' : (isOverdue ? 'overdue' : 'pending');

  return {
    id: b.id,
    name: b.name,
    amount: Number(b.amount),
    due_date: b.dueDate,
    category: b.category,
    is_paid: b.isPaid,
    status
  };
}

// GET /api/bills
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const bills = await prisma.bill.findMany({
      where: { userId: req.user.id },
      orderBy: { dueDate: 'asc' }
    });

    res.json(bills.map(mapBill));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// POST /api/bills
router.post('/', authenticate, billRules, validate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { name, amount, due_date, status = 'pending', category = 'Other' } = req.body;

    const bill = await prisma.bill.create({
      data: {
        userId: req.user.id,
        name,
        amount: new Prisma.Decimal(Number(amount)),
        dueDate: new Date(due_date),
        isPaid: status === 'paid',
        category
      }
    });

    res.status(201).json(mapBill(bill));
  } catch (err) {
    console.error('Error creating bill:', err);
    res.status(500).json({ error: 'Failed to create bill' });
  }
});

// PUT /api/bills/:id
router.put('/:id', authenticate, billRules, validate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { name, amount, due_date, status, category = 'Other' } = req.body;

    const existing = await prisma.bill.findFirst({
      where: { id: req.params.id as string, userId: req.user.id as string }
    });

    if (!existing) return res.status(404).json({ error: 'Bill not found' });

    const updated = await prisma.bill.update({
      where: { id: req.params.id as string },
      data: {
        name,
        amount: new Prisma.Decimal(Number(amount)),
        dueDate: new Date(due_date),
        isPaid: status === 'paid',
        category
      }
    });

    res.json(mapBill(updated));
  } catch (err) {
    console.error('Error updating bill:', err);
    res.status(500).json({ error: 'Failed to update bill' });
  }
});

// DELETE /api/bills/:id
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const bill = await prisma.bill.findFirst({
      where: { id: req.params.id as string, userId: req.user.id as string }
    });

    if (!bill) return res.status(404).json({ error: 'Bill not found' });

    await prisma.bill.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

export default router;
