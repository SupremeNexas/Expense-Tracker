import { Router, Response } from 'express';
import { body } from 'express-validator';
import { prisma } from '../db/prisma';
import { requireWorkspaceRole, WorkspaceRequest } from '../middleware/rbac';
import { Prisma } from '@prisma/client';
import { validate } from '../middleware/validation';
import { logAction } from '../services/audit/log';
import { triggerAutomations } from '../services/automation/engine';
import { convertCurrency } from '../services/currency/converter';

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

// Helper to get or create a default wallet for a workspace
async function getOrCreateWorkspaceWallet(userId: string, workspaceId: string, paymentMethod?: string, walletId?: string) {
  if (walletId) {
    const w = await prisma.wallet.findFirst({ where: { id: walletId, workspaceId } });
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
    where: { workspaceId, type }
  });

  if (!wallet) {
    // Check if any wallet exists, if so return first
    wallet = await prisma.wallet.findFirst({ where: { workspaceId } });
  }

  if (!wallet) {
    // Create new wallet
    wallet = await prisma.wallet.create({
      data: {
        userId,
        workspaceId,
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
router.get('/wallets', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']), async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });

    let wallets = await prisma.wallet.findMany({
      where: { workspaceId: req.workspaceId }
    });

    if (wallets.length === 0) {
      const defaultWallet = await prisma.wallet.create({
        data: {
          userId: req.user.id,
          workspaceId: req.workspaceId,
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

// GET /api/expenses - List transactions scoped by workspace
router.get('/', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']), async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });

    const { month, year, category_id, search, sort = 'date', order = 'desc' } = req.query;

    const whereClause: Prisma.TransactionWhereInput = {
      workspaceId: req.workspaceId
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
        { tags: { has: s } }
      ];
    }

    const sortField = sort === 'category' ? 'categoryId' : (sort as string);
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: { 
        category: true,
        user: { select: { name: true, email: true } }
      },
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
      is_recurring: t.isRecurring,
      creator: t.user?.name || 'Unknown'
    }));

    res.json(mapped);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// GET /api/expenses/:id
router.get('/:id', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']), async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });

    const t = await prisma.transaction.findFirst({
      where: { id: req.params.id as string, workspaceId: req.workspaceId },
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

// POST /api/expenses - Create transaction
router.post('/', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR']), expenseRules, validate, async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });
    const { title, amount, category_id, date, notes = '', payment_method = 'Card', tags = [], wallet_id, type = 'EXPENSE' } = req.body;

    const category = await prisma.category.findFirst({
      where: {
        id: category_id,
        OR: [
          { userId: req.user.id },
          { userId: null },
          { workspaceId: req.workspaceId }
        ]
      }
    });

    if (!category) {
      return res.status(400).json({ error: 'Category not found' });
    }

    const wallet = await getOrCreateWorkspaceWallet(req.user.id, req.workspaceId, payment_method, wallet_id);

    // Multi-currency conversion: Convert wallet currency to workspace base currency if different
    const userSettings = await prisma.settings.findFirst({ where: { userId: req.user.id } });
    const baseCurrency = userSettings?.currency || 'USD';
    const finalAmount = await convertCurrency(Number(amount), wallet.currency, baseCurrency);

    const transaction = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId: req.user.id,
          workspaceId: req.workspaceId,
          title,
          amount: new Prisma.Decimal(finalAmount),
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

      // Update Wallet Balance
      const change = Number(amount);
      const balanceChange = type === 'EXPENSE' ? -change : change;
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: balanceChange } }
      });

      // 1. Immutable Audit Logging
      await logAction(
        req.user.id,
        req.workspaceId,
        'TRANSACTION_CREATE',
        'Transaction',
        transaction.id,
        null,
        transaction,
        tx
      );

      return transaction;
    });

    // 2. Trigger Automations Engine (run outside transaction to prevent holding locks)
    await triggerAutomations(req.workspaceId, 'TRANSACTION_CREATED', transaction);

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

// PUT /api/expenses/:id - Edit transaction
router.put('/:id', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR']), expenseRules, validate, async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });
    const { title, amount, category_id, date, notes = '', payment_method = 'Card', tags = [], wallet_id, type = 'EXPENSE' } = req.body;

    const transaction = await prisma.transaction.findFirst({
      where: { id: req.params.id as string, workspaceId: req.workspaceId }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const category = await prisma.category.findFirst({
      where: {
        id: category_id,
        OR: [
          { userId: req.user.id },
          { userId: null },
          { workspaceId: req.workspaceId }
        ]
      }
    });

    if (!category) {
      return res.status(400).json({ error: 'Category not found' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Revert old wallet balance
      const oldAmount = Number(transaction.amount);
      const oldBalanceChange = transaction.type === 'EXPENSE' ? oldAmount : -oldAmount;
      await tx.wallet.update({
        where: { id: transaction.walletId },
        data: { balance: { increment: oldBalanceChange } }
      });

      // Apply new wallet balance
      const wallet = await getOrCreateWorkspaceWallet(req.user.id, req.workspaceId, payment_method, wallet_id);
      const newAmount = Number(amount);
      const newBalanceChange = type === 'EXPENSE' ? -newAmount : newAmount;

      // Convert currency if needed
      const userSettings = await tx.settings.findFirst({ where: { userId: req.user.id } });
      const baseCurrency = userSettings?.currency || 'USD';
      const finalAmount = await convertCurrency(newAmount, wallet.currency, baseCurrency);

      const updated = await tx.transaction.update({
        where: { id: req.params.id as string },
        data: {
          title,
          amount: new Prisma.Decimal(finalAmount),
          type,
          categoryId: category_id,
          walletId: wallet.id,
          paymentMethod: payment_method,
          tags: Array.isArray(tags) ? tags : [],
          notes,
          date: new Date(date),
          lastEditorId: req.user.id
        },
        include: { category: true }
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: newBalanceChange } }
      });

      // Audit Logging
      await logAction(
        req.user.id,
        req.workspaceId,
        'TRANSACTION_UPDATE',
        'Transaction',
        updated.id,
        transaction,
        updated,
        tx
      );

      return updated;
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
router.delete('/:id', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });

    const transaction = await prisma.transaction.findFirst({
      where: { id: req.params.id as string, workspaceId: req.workspaceId }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await prisma.$transaction(async (tx) => {
      // Revert wallet balance
      const amount = Number(transaction.amount);
      const balanceRevert = transaction.type === 'EXPENSE' ? amount : -amount;
      await tx.wallet.update({
        where: { id: transaction.walletId },
        data: { balance: { increment: balanceRevert } }
      });

      await tx.transaction.delete({
        where: { id: req.params.id as string }
      });

      // Audit Logging
      await logAction(
        req.user.id,
        req.workspaceId,
        'TRANSACTION_DELETE',
        'Transaction',
        transaction.id,
        transaction,
        null,
        tx
      );
    });

    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
