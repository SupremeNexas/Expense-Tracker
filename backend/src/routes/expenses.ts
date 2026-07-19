import { Router, Response } from 'express';
import { body } from 'express-validator';
import { prisma } from '../db/prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { Prisma } from '@prisma/client';
import { validate } from '../middleware/validation';

const router = Router();

const expenseRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('category_id').notEmpty().withMessage('Category is required'),
  body('date').isISO8601().withMessage('Valid date is required (YYYY-MM-DD)'),
  body('notes').optional().trim().isLength({ max: 500 }),
  body('payment_method').optional().trim(),
  body('wallet_id').optional().trim(),
];

// Helper to get or create a default wallet for a user
async function getOrCreateWallet(userId: string, paymentMethod?: string, walletId?: string) {
  if (walletId) {
    const w = await prisma.wallet.findFirst({ where: { id: walletId, userId } });
    if (w) return w;
  }

  // Map payment method to type
  let type = 'BANK';
  let name = 'Main Account';
  if (paymentMethod === 'Cash') {
    type = 'CASH';
    name = 'Cash Wallet';
  } else if (paymentMethod === 'Credit Card') {
    type = 'CREDIT_CARD';
    name = 'Credit Card';
  } else if (paymentMethod === 'UPI') {
    type = 'UPI';
    name = 'UPI Wallet';
  }

  // Find existing wallet of this type
  let wallet = await prisma.wallet.findFirst({
    where: { userId, type }
  });

  if (!wallet) {
    // Check if any wallet exists, if so return first
    wallet = await prisma.wallet.findFirst({ where: { userId } });
  }

  if (!wallet) {
    // Create new wallet
    wallet = await prisma.wallet.create({
      data: {
        userId,
        name,
        type,
        balance: 10000.00,
        color: '#10B981'
      }
    });
  }

  return wallet;
}

// GET /api/expenses/wallets
router.get('/wallets', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    let wallets = await prisma.wallet.findMany({
      where: { userId: req.user.id }
    });

    if (wallets.length === 0) {
      const defaultWallet = await prisma.wallet.create({
        data: {
          userId: req.user.id,
          name: 'Cash Wallet',
          type: 'CASH',
          balance: 10000
        }
      });
      wallets = [defaultWallet];
    }

    res.json(wallets);
  } catch (err) {
    console.error('Error fetching wallets:', err);
    res.status(500).json({ error: 'Failed to fetch wallets' });
  }
});

// GET /api/expenses
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { month, year, category_id, search, sort = 'date', order = 'desc' } = req.query;

    const whereClause: Prisma.TransactionWhereInput = {
      userId: req.user.id
    };

    if (month && year) {
      const m = parseInt(month as string);
      const y = parseInt(year as string);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59);
      whereClause.date = { gte: start, lte: end };
    } else if (year) {
      const y = parseInt(year as string);
      const start = new Date(y, 0, 1);
      const end = new Date(y, 11, 31, 23, 59, 59);
      whereClause.date = { gte: start, lte: end };
    }

    if (category_id && category_id !== '') {
      whereClause.categoryId = category_id as string;
    }

    if (search && search !== '') {
      const s = search as string;
      whereClause.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { notes: { contains: s, mode: 'insensitive' } },
        { tags: { has: s } } // Check if array has the term
      ];
    }

    const sortField = sort === 'category' ? 'categoryId' : (sort as string);
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: { category: true },
      orderBy: { [sortField]: order === 'asc' ? 'asc' : 'desc' }
    });

    const mapped = transactions.map(t => ({
      id: t.id,
      userId: t.userId,
      title: t.title,
      amount: Number(t.amount),
      type: t.type,
      category_id: t.categoryId,
      category_name: t.category.name,
      category_color: t.category.color,
      category_icon: t.category.icon,
      date: t.date,
      payment_method: t.paymentMethod,
      tags: t.tags,
      notes: t.notes,
      location: t.location,
      attachment_url: t.attachmentUrl,
      receipt_url: t.receiptUrl,
      is_recurring: t.isRecurring
    }));

    res.json(mapped);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// GET /api/expenses/:id
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const t: any = await prisma.transaction.findFirst({
      where: { id: req.params.id as string, userId: req.user.id as string },
      include: { category: true }
    });

    if (!t) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({
      id: t.id,
      title: t.title,
      amount: Number(t.amount),
      type: t.type,
      category_id: t.categoryId,
      category_name: t.category.name,
      category_color: t.category.color,
      category_icon: t.category.icon,
      date: t.date,
      payment_method: t.paymentMethod,
      tags: t.tags,
      notes: t.notes,
      location: t.location,
      attachment_url: t.attachmentUrl,
      receipt_url: t.receiptUrl,
      is_recurring: t.isRecurring
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// POST /api/expenses
router.post('/', authenticate, expenseRules, validate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { title, amount, category_id, date, notes = '', payment_method = 'Card', tags = [], wallet_id, type = 'EXPENSE' } = req.body;

    const category = await prisma.category.findFirst({
      where: {
        id: category_id,
        OR: [
          { userId: req.user.id },
          { userId: null }
        ]
      }
    });

    if (!category) {
      return res.status(400).json({ error: 'Category not found' });
    }

    const wallet = await getOrCreateWallet(req.user.id, payment_method, wallet_id);

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.id,
        title,
        amount: new Prisma.Decimal(Number(amount)),
        type: type,
        categoryId: category_id,
        walletId: wallet.id,
        paymentMethod: payment_method,
        tags: Array.isArray(tags) ? tags : [],
        notes,
        date: new Date(date),
      },
      include: { category: true }
    });

    // Update Wallet Balance
    const change = Number(amount);
    const balanceChange = type === 'EXPENSE' ? -change : change;
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: balanceChange } }
    });

    res.status(201).json({
      id: transaction.id,
      title: transaction.title,
      amount: Number(transaction.amount),
      type: transaction.type,
      category_id: transaction.categoryId,
      category_name: transaction.category.name,
      category_color: transaction.category.color,
      category_icon: transaction.category.icon,
      date: transaction.date,
      payment_method: transaction.paymentMethod,
      tags: transaction.tags,
      notes: transaction.notes,
    });
  } catch (err) {
    console.error('Error creating expense:', err);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT /api/expenses/:id
router.put('/:id', authenticate, expenseRules, validate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { title, amount, category_id, date, notes = '', payment_method = 'Card', tags = [], wallet_id, type = 'EXPENSE' } = req.body;

    const transaction = await prisma.transaction.findFirst({
      where: { id: req.params.id as string, userId: req.user.id as string }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const category = await prisma.category.findFirst({
      where: {
        id: category_id,
        OR: [
          { userId: req.user.id },
          { userId: null }
        ]
      }
    });

    if (!category) {
      return res.status(400).json({ error: 'Category not found' });
    }

    // Revert old wallet balance
    const oldAmount = Number(transaction.amount);
    const oldBalanceChange = transaction.type === 'EXPENSE' ? oldAmount : -oldAmount;
    await prisma.wallet.update({
      where: { id: transaction.walletId },
      data: { balance: { increment: oldBalanceChange } }
    });

    // Apply new wallet balance
    const wallet = await getOrCreateWallet(req.user.id, payment_method, wallet_id);
    const newAmount = Number(amount);
    const newBalanceChange = type === 'EXPENSE' ? -newAmount : newAmount;
    
    const updated: any = await prisma.transaction.update({
      where: { id: req.params.id as string },
      data: {
        title,
        amount: new Prisma.Decimal(newAmount),
        type,
        categoryId: category_id,
        walletId: wallet.id,
        paymentMethod: payment_method,
        tags: Array.isArray(tags) ? tags : [],
        notes,
        date: new Date(date),
      },
      include: { category: true }
    });

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: newBalanceChange } }
    });

    res.json({
      id: updated.id,
      title: updated.title,
      amount: Number(updated.amount),
      type: updated.type,
      category_id: updated.categoryId,
      category_name: updated.category.name,
      category_color: updated.category.color,
      category_icon: updated.category.icon,
      date: updated.date,
      payment_method: updated.paymentMethod,
      tags: updated.tags,
      notes: updated.notes,
    });
  } catch (err) {
    console.error('Error updating expense:', err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const transaction = await prisma.transaction.findFirst({
      where: { id: req.params.id as string, userId: req.user.id as string }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Revert wallet balance
    const amount = Number(transaction.amount);
    const balanceRevert = transaction.type === 'EXPENSE' ? amount : -amount;
    await prisma.wallet.update({
      where: { id: transaction.walletId },
      data: { balance: { increment: balanceRevert } }
    });

    await prisma.transaction.delete({
      where: { id: req.params.id as string }
    });

    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
