import { Router, Response } from 'express';
import { body, query, param } from 'express-validator';
import { prisma } from '../db/prisma';
import { requireWorkspaceRole, WorkspaceRequest } from '../middleware/rbac';
import { Prisma } from '@prisma/client';
import { validate } from '../middleware/validation';
import { logAction } from '../services/audit/log';

const router = Router();

const recurringRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title must be at most 200 characters'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('category_id').notEmpty().withMessage('Category is required').isUUID().withMessage('Category ID must be a valid UUID'),
  body('wallet_id').notEmpty().withMessage('Wallet is required').isUUID().withMessage('Wallet ID must be a valid UUID'),
  body('frequency').isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).withMessage('Invalid frequency'),
  body('type').optional().isIn(['EXPENSE', 'INCOME']).withMessage('Type must be EXPENSE or INCOME'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('nextDate').optional().isISO8601().withMessage('Valid next date is required'),
  body('endDate').optional({ nullable: true }).isISO8601().withMessage('Valid end date is required'),
];

// GET /api/recurring
router.get('/', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']), async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });

    const { type } = req.query;

    const whereClause: Prisma.RecurringTransactionWhereInput = {
      workspaceId: req.workspaceId
    };

    if (type && ['EXPENSE', 'INCOME'].includes(String(type).toUpperCase())) {
      whereClause.type = String(type).toUpperCase();
    }

    const items = await prisma.recurringTransaction.findMany({
      where: whereClause,
      include: {
        category: true,
        wallet: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = items.map(item => ({
      id: item.id,
      title: item.title,
      amount: Number(item.amount),
      type: item.type,
      category_id: item.categoryId,
      category_name: item.category.name,
      category_color: item.category.color,
      category_icon: item.category.icon,
      wallet_id: item.walletId,
      wallet_name: item.wallet.name,
      frequency: item.frequency,
      startDate: item.startDate,
      nextDate: item.nextDate,
      endDate: item.endDate,
      isActive: item.isActive,
      createdAt: item.createdAt,
    }));

    res.json(mapped);
  } catch (err) {
    console.error('Error fetching recurring transactions:', err);
    res.status(500).json({ error: 'Failed to fetch recurring transactions' });
  }
});

// POST /api/recurring
router.post('/', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR']), recurringRules, validate, async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      title,
      amount,
      category_id,
      wallet_id,
      frequency,
      type = 'INCOME',
      startDate,
      nextDate,
      endDate
    } = req.body;

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

    const wallet = await prisma.wallet.findFirst({
      where: { id: wallet_id, workspaceId: req.workspaceId }
    });

    if (!wallet) {
      return res.status(400).json({ error: 'Wallet not found' });
    }

    const start = new Date(startDate);
    const next = nextDate ? new Date(nextDate) : new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    const item = await prisma.recurringTransaction.create({
      data: {
        userId: req.user.id,
        workspaceId: req.workspaceId,
        title,
        amount: new Prisma.Decimal(amount),
        type,
        categoryId: category_id,
        walletId: wallet_id,
        frequency,
        startDate: start,
        nextDate: next,
        endDate: end,
        isActive: true,
      },
      include: {
        category: true,
        wallet: true,
      }
    });

    await logAction(
      req.user.id,
      req.workspaceId,
      'RECURRING_CREATE',
      'RecurringTransaction',
      item.id,
      null,
      item
    );

    res.status(201).json({
      id: item.id,
      title: item.title,
      amount: Number(item.amount),
      type: item.type,
      category_id: item.categoryId,
      category_name: item.category.name,
      category_color: item.category.color,
      category_icon: item.category.icon,
      wallet_id: item.walletId,
      wallet_name: item.wallet.name,
      frequency: item.frequency,
      startDate: item.startDate,
      nextDate: item.nextDate,
      endDate: item.endDate,
      isActive: item.isActive,
      createdAt: item.createdAt,
    });
  } catch (err) {
    console.error('Error creating recurring transaction:', err);
    res.status(500).json({ error: 'Failed to create recurring transaction' });
  }
});

// PUT /api/recurring/:id
router.put('/:id', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR']), [
  param('id').isUUID().withMessage('Invalid ID'),
  ...recurringRules
], validate, async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });

    const existing = await prisma.recurringTransaction.findFirst({
      where: { id: req.params.id as string, workspaceId: req.workspaceId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }

    const {
      title,
      amount,
      category_id,
      wallet_id,
      frequency,
      type = 'INCOME',
      startDate,
      nextDate,
      endDate,
      isActive
    } = req.body;

    const start = new Date(startDate);
    const next = nextDate ? new Date(nextDate) : new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    const updated = await prisma.recurringTransaction.update({
      where: { id: req.params.id as string },
      data: {
        title,
        amount: new Prisma.Decimal(amount),
        type,
        categoryId: category_id,
        walletId: wallet_id,
        frequency,
        startDate: start,
        nextDate: next,
        endDate: end,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      },
      include: {
        category: true,
        wallet: true,
      }
    });

    await logAction(
      req.user.id,
      req.workspaceId,
      'RECURRING_UPDATE',
      'RecurringTransaction',
      updated.id,
      existing,
      updated
    );

    res.json({
      id: updated.id,
      title: updated.title,
      amount: Number(updated.amount),
      type: updated.type,
      category_id: updated.categoryId,
      category_name: updated.category.name,
      category_color: updated.category.color,
      category_icon: updated.category.icon,
      wallet_id: updated.walletId,
      wallet_name: updated.wallet.name,
      frequency: updated.frequency,
      startDate: updated.startDate,
      nextDate: updated.nextDate,
      endDate: updated.endDate,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
    });
  } catch (err) {
    console.error('Error updating recurring transaction:', err);
    res.status(500).json({ error: 'Failed to update recurring transaction' });
  }
});

// DELETE /api/recurring/:id
router.delete('/:id', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR']), [
  param('id').isUUID().withMessage('Invalid ID')
], validate, async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });

    const existing = await prisma.recurringTransaction.findFirst({
      where: { id: req.params.id as string, workspaceId: req.workspaceId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }

    await prisma.recurringTransaction.delete({
      where: { id: req.params.id as string }
    });

    await logAction(
      req.user.id,
      req.workspaceId,
      'RECURRING_DELETE',
      'RecurringTransaction',
      existing.id,
      existing,
      null
    );

    res.json({ message: 'Recurring transaction deleted successfully' });
  } catch (err) {
    console.error('Error deleting recurring transaction:', err);
    res.status(500).json({ error: 'Failed to delete recurring transaction' });
  }
});

// POST /api/recurring/:id/process - Manually execute scheduled occurrence immediately
router.post('/:id/process', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR']), [
  param('id').isUUID().withMessage('Invalid ID')
], validate, async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });

    const rec = await prisma.recurringTransaction.findFirst({
      where: { id: req.params.id as string, workspaceId: req.workspaceId }
    });

    if (!rec) {
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }

    const now = new Date();

    const transaction = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          userId: req.user!.id,
          workspaceId: req.workspaceId!,
          title: rec.title,
          amount: rec.amount,
          type: rec.type,
          categoryId: rec.categoryId,
          walletId: rec.walletId,
          paymentMethod: 'Auto-Debit / Scheduled',
          tags: ['recurring', rec.type.toLowerCase()],
          date: now,
          isRecurring: true,
          notes: `Auto-generated from recurring rule: ${rec.title}`
        },
        include: { category: true }
      });

      const balanceChange = rec.type === 'INCOME' ? Number(rec.amount) : -Number(rec.amount);

      await tx.wallet.update({
        where: { id: rec.walletId },
        data: { balance: { increment: balanceChange } }
      });

      const nextDate = new Date(rec.nextDate);
      if (rec.frequency === 'DAILY') nextDate.setDate(nextDate.getDate() + 1);
      else if (rec.frequency === 'WEEKLY') nextDate.setDate(nextDate.getDate() + 7);
      else if (rec.frequency === 'YEARLY') nextDate.setFullYear(nextDate.getFullYear() + 1);
      else nextDate.setMonth(nextDate.getMonth() + 1);

      const shouldDeactivate = rec.endDate && nextDate > new Date(rec.endDate);

      await tx.recurringTransaction.update({
        where: { id: rec.id },
        data: {
          nextDate,
          isActive: shouldDeactivate ? false : rec.isActive
        }
      });

      return created;
    });

    res.status(201).json({
      message: 'Recurring occurrence processed successfully',
      transaction: {
        id: transaction.id,
        title: transaction.title,
        amount: Number(transaction.amount),
        type: transaction.type,
        date: transaction.date
      }
    });
  } catch (err) {
    console.error('Error processing recurring transaction:', err);
    res.status(500).json({ error: 'Failed to process recurring transaction' });
  }
});

export default router;
