import { Router, Response } from 'express';
import { body, query, param } from 'express-validator';
import { prisma } from '../db/prisma';
import { requireWorkspaceRole, WorkspaceRequest } from '../middleware/rbac';
import { Prisma } from '@prisma/client';
import { validate } from '../middleware/validation';
import { logAction } from '../services/audit/log';
import { convertCurrency } from '../services/currency/converter';

const router = Router();

const transferRules = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('wallet_id').trim().notEmpty().withMessage('Source wallet ID is required').isUUID().withMessage('Source wallet ID must be a valid UUID'),
  body('to_wallet_id').trim().notEmpty().withMessage('Destination wallet ID is required').isUUID().withMessage('Destination wallet ID must be a valid UUID'),
  body('date').optional().isISO8601().withMessage('Valid date is required (YYYY-MM-DD)'),
  body('title').optional().trim().isLength({ max: 200 }).withMessage('Title must be at most 200 characters'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be at most 500 characters'),
  body('payment_method').optional().trim().isLength({ max: 100 }).withMessage('Payment method must be at most 100 characters'),
  body('category_id').optional().trim().isUUID().withMessage('Category ID must be a valid UUID'),
  body('tags').optional().isArray().withMessage('Tags must be an array of strings'),
  body('tags.*').optional().isString().trim().notEmpty().withMessage('Each tag must be a non-empty string'),
];

const listTransfersRules = [
  query('search').optional().isString().trim(),
  query('wallet_id').optional().isString().trim(),
  query('to_wallet_id').optional().isString().trim(),
  query('sort').optional().isIn(['date', 'title', 'amount']).withMessage('Invalid sort field'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
  query('minAmount').optional().isFloat({ min: 0 }).withMessage('minAmount must be a positive number'),
  query('maxAmount').optional().isFloat({ min: 0 }).withMessage('maxAmount must be a positive number'),
  query('startDate').optional().isString().trim(),
  query('endDate').optional().isString().trim(),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be an integer >= 1'),
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be an integer between 1 and 200'),
];

const idParamRules = [
  param('id').isUUID().withMessage('Invalid transfer ID format'),
];

// Helper to find or create a Transfer category for the workspace
async function getOrCreateTransferCategory(userId: string, workspaceId: string, customCategoryId?: string) {
  if (customCategoryId) {
    const cat = await prisma.category.findFirst({
      where: {
        id: customCategoryId,
        OR: [
          { workspaceId },
          { userId },
          { userId: null }
        ]
      }
    });
    if (cat) return cat;
  }

  let cat = await prisma.category.findFirst({
    where: {
      name: { equals: 'Transfer', mode: 'insensitive' },
      OR: [
        { workspaceId },
        { userId },
        { userId: null }
      ]
    }
  });

  if (!cat) {
    cat = await prisma.category.findFirst({
      where: {
        OR: [
          { workspaceId },
          { userId },
          { userId: null }
        ]
      }
    });
  }

  if (!cat) {
    cat = await prisma.category.create({
      data: {
        userId,
        workspaceId,
        name: 'Transfer',
        color: '#6366F1',
        icon: 'repeat',
        type: 'EXPENSE'
      }
    });
  }

  return cat;
}

// GET /api/transfers - List workspace transfers
router.get('/', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']), listTransfersRules, validate, async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      search,
      wallet_id,
      to_wallet_id,
      sort = 'date',
      order = 'desc',
      minAmount,
      maxAmount,
      startDate,
      endDate,
      page,
      limit
    } = req.query;

    const whereClause: Prisma.TransactionWhereInput = {
      workspaceId: req.workspaceId,
      type: 'TRANSFER'
    };

    if (search && String(search).trim() !== '') {
      const s = String(search).trim();
      whereClause.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { notes: { contains: s, mode: 'insensitive' } },
        { wallet: { name: { contains: s, mode: 'insensitive' } } },
        { toWallet: { name: { contains: s, mode: 'insensitive' } } }
      ];
    }

    if (wallet_id && wallet_id !== '') {
      whereClause.walletId = String(wallet_id).trim();
    }

    if (to_wallet_id && to_wallet_id !== '') {
      whereClause.toWalletId = String(to_wallet_id).trim();
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      whereClause.amount = {};
      if (minAmount !== undefined && minAmount !== '') {
        whereClause.amount.gte = new Prisma.Decimal(Number(minAmount));
      }
      if (maxAmount !== undefined && maxAmount !== '') {
        whereClause.amount.lte = new Prisma.Decimal(Number(maxAmount));
      }
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        const eDate = new Date(endDate as string);
        if (String(endDate).length === 10) {
          eDate.setHours(23, 59, 59, 999);
        }
        whereClause.date.lte = eDate;
      }
    }

    let orderBy: Prisma.TransactionOrderByWithRelationInput = { date: order === 'asc' ? 'asc' : 'desc' };
    if (sort === 'title') {
      orderBy = { title: order === 'asc' ? 'asc' : 'desc' };
    } else if (sort === 'amount') {
      orderBy = { amount: order === 'asc' ? 'asc' : 'desc' };
    }

    const isPaginated = page !== undefined || limit !== undefined || req.query.paginate === 'true';
    const pageNum = page ? Math.max(1, parseInt(page as string)) : 1;
    const limitNum = limit ? Math.min(200, Math.max(1, parseInt(limit as string))) : 20;

    const totalCount = await prisma.transaction.count({ where: whereClause });

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        category: true,
        wallet: true,
        toWallet: true,
        user: { select: { name: true, email: true } }
      },
      orderBy,
      ...(isPaginated ? { skip: (pageNum - 1) * limitNum, take: limitNum } : {})
    });

    const mapped = transactions.map(t => ({
      id: t.id,
      userId: t.userId,
      title: t.title,
      amount: Number(t.amount),
      type: t.type,
      category_id: t.categoryId,
      category_name: t.category?.name || 'Transfer',
      wallet_id: t.walletId,
      walletId: t.walletId,
      sourceWalletName: t.wallet?.name || 'Source Account',
      to_wallet_id: t.toWalletId,
      toWalletId: t.toWalletId,
      destinationWalletName: t.toWallet?.name || 'Destination Account',
      date: t.date,
      payment_method: t.paymentMethod,
      paymentMethod: t.paymentMethod,
      tags: t.tags,
      notes: t.notes,
      creator: t.user?.name || 'Unknown'
    }));

    if (isPaginated) {
      res.json({
        data: mapped,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      });
    } else {
      res.json(mapped);
    }
  } catch (err) {
    console.error('Error fetching transfers:', err);
    res.status(500).json({ error: 'Failed to fetch transfers' });
  }
});

// GET /api/transfers/:id
router.get('/:id', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']), idParamRules, validate, async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });

    const t = await prisma.transaction.findFirst({
      where: {
        id: req.params.id as string,
        workspaceId: req.workspaceId,
        type: 'TRANSFER'
      },
      include: {
        category: true,
        wallet: true,
        toWallet: true
      }
    });

    if (!t) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    res.json({
      id: t.id,
      title: t.title,
      amount: Number(t.amount),
      type: t.type,
      category_id: t.categoryId,
      category_name: t.category.name,
      wallet_id: t.walletId,
      walletId: t.walletId,
      sourceWalletName: t.wallet.name,
      to_wallet_id: t.toWalletId,
      toWalletId: t.toWalletId,
      destinationWalletName: t.toWallet?.name,
      date: t.date,
      payment_method: t.paymentMethod,
      tags: t.tags,
      notes: t.notes
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transfer' });
  }
});

// POST /api/transfers - Create transfer between two accounts
router.post('/', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR']), transferRules, validate, async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      amount,
      wallet_id,
      to_wallet_id,
      date,
      title,
      notes = '',
      payment_method = 'Transfer',
      category_id,
      tags = []
    } = req.body;

    // 1. Same-account rejection
    if (wallet_id === to_wallet_id) {
      return res.status(400).json({ error: 'Source and destination accounts must be different' });
    }

    // 2. Authorization check for source wallet
    const sourceWallet = await prisma.wallet.findFirst({
      where: { id: wallet_id, workspaceId: req.workspaceId }
    });
    if (!sourceWallet) {
      return res.status(400).json({ error: 'Unauthorized or invalid source account' });
    }

    // 3. Authorization check for destination wallet
    const destWallet = await prisma.wallet.findFirst({
      where: { id: to_wallet_id, workspaceId: req.workspaceId }
    });
    if (!destWallet) {
      return res.status(400).json({ error: 'Unauthorized or invalid destination account' });
    }

    // 4. Multi-currency conversion: convert source currency to workspace base currency for storage
    const userSettings = await prisma.settings.findFirst({ where: { userId: req.user.id } });
    const baseCurrency = userSettings?.currency || 'USD';
    const numAmount = Number(amount);
    const finalAmount = await convertCurrency(numAmount, sourceWallet.currency, baseCurrency);

    // 5. Category lookup
    const category = await getOrCreateTransferCategory(req.user.id, req.workspaceId, category_id);

    // Default title
    const transferTitle = title && title.trim() ? title.trim() : `Transfer: ${sourceWallet.name} ➔ ${destWallet.name}`;
    const transferDate = date ? new Date(date) : new Date();

    // 6. Atomic Transaction
    const transfer = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          userId: req.user.id,
          workspaceId: req.workspaceId,
          title: transferTitle,
          amount: new Prisma.Decimal(finalAmount),
          type: 'TRANSFER',
          categoryId: category.id,
          walletId: sourceWallet.id,
          toWalletId: destWallet.id,
          paymentMethod: payment_method,
          tags: Array.isArray(tags) ? tags : [],
          notes,
          date: transferDate
        },
        include: {
          category: true,
          wallet: true,
          toWallet: true
        }
      });

      // Decrease source balance
      await tx.wallet.update({
        where: { id: sourceWallet.id },
        data: { balance: { decrement: numAmount } }
      });

      // Increase destination balance
      await tx.wallet.update({
        where: { id: destWallet.id },
        data: { balance: { increment: numAmount } }
      });

      // Audit Log
      await logAction(
        req.user.id,
        req.workspaceId,
        'TRANSACTION_CREATE',
        'Transaction',
        created.id,
        null,
        created,
        tx
      );

      return created;
    });

    res.status(201).json({
      id: transfer.id,
      title: transfer.title,
      amount: Number(transfer.amount),
      type: transfer.type,
      category_id: transfer.categoryId,
      category_name: transfer.category.name,
      wallet_id: transfer.walletId,
      walletId: transfer.walletId,
      sourceWalletName: transfer.wallet.name,
      to_wallet_id: transfer.toWalletId,
      toWalletId: transfer.toWalletId,
      destinationWalletName: transfer.toWallet?.name,
      date: transfer.date,
      payment_method: transfer.paymentMethod,
      tags: transfer.tags,
      notes: transfer.notes
    });
  } catch (err) {
    console.error('Error creating transfer:', err);
    res.status(500).json({ error: 'Failed to create transfer' });
  }
});

// PUT /api/transfers/:id - Update transfer
router.put('/:id', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR']), idParamRules, transferRules, validate, async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      amount,
      wallet_id,
      to_wallet_id,
      date,
      title,
      notes = '',
      payment_method = 'Transfer',
      category_id,
      tags = []
    } = req.body;

    if (wallet_id === to_wallet_id) {
      return res.status(400).json({ error: 'Source and destination accounts must be different' });
    }

    const existingTransfer = await prisma.transaction.findFirst({
      where: {
        id: req.params.id as string,
        workspaceId: req.workspaceId
      }
    });

    if (!existingTransfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    // Authorization checks for new wallets
    const sourceWallet = await prisma.wallet.findFirst({
      where: { id: wallet_id, workspaceId: req.workspaceId }
    });
    if (!sourceWallet) {
      return res.status(400).json({ error: 'Unauthorized or invalid source account' });
    }

    const destWallet = await prisma.wallet.findFirst({
      where: { id: to_wallet_id, workspaceId: req.workspaceId }
    });
    if (!destWallet) {
      return res.status(400).json({ error: 'Unauthorized or invalid destination account' });
    }

    const category = await getOrCreateTransferCategory(req.user.id, req.workspaceId, category_id);
    const numAmount = Number(amount);

    const userSettings = await prisma.settings.findFirst({ where: { userId: req.user.id } });
    const baseCurrency = userSettings?.currency || 'USD';
    const finalAmount = await convertCurrency(numAmount, sourceWallet.currency, baseCurrency);

    const transferTitle = title && title.trim() ? title.trim() : `Transfer: ${sourceWallet.name} ➔ ${destWallet.name}`;
    const transferDate = date ? new Date(date) : new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const oldAmount = Number(existingTransfer.amount);

      // Revert old balances based on existing transfer or expense type
      if (existingTransfer.type === 'TRANSFER') {
        // Revert old source (add back)
        await tx.wallet.update({
          where: { id: existingTransfer.walletId },
          data: { balance: { increment: oldAmount } }
        });
        // Revert old destination (subtract back)
        if (existingTransfer.toWalletId) {
          await tx.wallet.update({
            where: { id: existingTransfer.toWalletId },
            data: { balance: { decrement: oldAmount } }
          });
        }
      } else if (existingTransfer.type === 'EXPENSE') {
        await tx.wallet.update({
          where: { id: existingTransfer.walletId },
          data: { balance: { increment: oldAmount } }
        });
      } else if (existingTransfer.type === 'INCOME') {
        await tx.wallet.update({
          where: { id: existingTransfer.walletId },
          data: { balance: { decrement: oldAmount } }
        });
      }

      // Apply new transfer balances
      await tx.wallet.update({
        where: { id: sourceWallet.id },
        data: { balance: { decrement: numAmount } }
      });

      await tx.wallet.update({
        where: { id: destWallet.id },
        data: { balance: { increment: numAmount } }
      });

      const result = await tx.transaction.update({
        where: { id: req.params.id as string },
        data: {
          title: transferTitle,
          amount: new Prisma.Decimal(finalAmount),
          type: 'TRANSFER',
          categoryId: category.id,
          walletId: sourceWallet.id,
          toWalletId: destWallet.id,
          paymentMethod: payment_method,
          tags: Array.isArray(tags) ? tags : [],
          notes,
          date: transferDate,
          lastEditorId: req.user.id
        },
        include: {
          category: true,
          wallet: true,
          toWallet: true
        }
      });

      await logAction(
        req.user.id,
        req.workspaceId,
        'TRANSACTION_UPDATE',
        'Transaction',
        result.id,
        existingTransfer,
        result,
        tx
      );

      return result;
    });

    res.json({
      id: updated.id,
      title: updated.title,
      amount: Number(updated.amount),
      type: updated.type,
      category_id: updated.categoryId,
      category_name: updated.category.name,
      wallet_id: updated.walletId,
      walletId: updated.walletId,
      sourceWalletName: updated.wallet.name,
      to_wallet_id: updated.toWalletId,
      toWalletId: updated.toWalletId,
      destinationWalletName: updated.toWallet?.name,
      date: updated.date,
      payment_method: updated.paymentMethod,
      tags: updated.tags,
      notes: updated.notes
    });
  } catch (err) {
    console.error('Error updating transfer:', err);
    res.status(500).json({ error: 'Failed to update transfer' });
  }
});

// DELETE /api/transfers/:id - Delete transfer
router.delete('/:id', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR']), idParamRules, validate, async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });

    const existingTransfer = await prisma.transaction.findFirst({
      where: {
        id: req.params.id as string,
        workspaceId: req.workspaceId
      }
    });

    if (!existingTransfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    await prisma.$transaction(async (tx) => {
      const amount = Number(existingTransfer.amount);

      if (existingTransfer.type === 'TRANSFER') {
        // Revert source wallet (increment back)
        await tx.wallet.update({
          where: { id: existingTransfer.walletId },
          data: { balance: { increment: amount } }
        });

        // Revert destination wallet (decrement back)
        if (existingTransfer.toWalletId) {
          await tx.wallet.update({
            where: { id: existingTransfer.toWalletId },
            data: { balance: { decrement: amount } }
          });
        }
      } else if (existingTransfer.type === 'EXPENSE') {
        await tx.wallet.update({
          where: { id: existingTransfer.walletId },
          data: { balance: { increment: amount } }
        });
      } else if (existingTransfer.type === 'INCOME') {
        await tx.wallet.update({
          where: { id: existingTransfer.walletId },
          data: { balance: { decrement: amount } }
        });
      }

      await tx.transaction.delete({
        where: { id: req.params.id as string }
      });

      await logAction(
        req.user.id,
        req.workspaceId,
        'TRANSACTION_DELETE',
        'Transaction',
        existingTransfer.id,
        existingTransfer,
        null,
        tx
      );
    });

    res.json({ message: 'Transfer deleted successfully' });
  } catch (err) {
    console.error('Error deleting transfer:', err);
    res.status(500).json({ error: 'Failed to delete transfer' });
  }
});

export default router;
