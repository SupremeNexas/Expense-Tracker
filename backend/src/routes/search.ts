import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authenticate } from '../middleware/auth';
import { requireWorkspaceRole, WorkspaceRequest } from '../middleware/rbac';

const router = Router();

/**
 * GET /api/v1/search
 * Core global search endpoint to query transactions, categories, and wallets
 * in the active workspace with multi-attribute filtering.
 */
router.get('/', authenticate, requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']), async (req: WorkspaceRequest, res: Response) => {
  try {
    const { 
      q, 
      category, 
      wallet, 
      minAmount, 
      maxAmount, 
      startDate, 
      endDate, 
      sortBy = 'date', 
      sortOrder = 'desc' 
    } = req.query;

    const whereClause: any = {
      workspaceId: req.workspaceId
    };

    if (q && String(q).trim().length > 0) {
      const qStr = String(q).trim();
      whereClause.OR = [
        { title: { contains: qStr, mode: 'insensitive' } },
        { notes: { contains: qStr, mode: 'insensitive' } },
        { category: { name: { contains: qStr, mode: 'insensitive' } } }
      ];
    }

    if (category) {
      whereClause.category = {
        name: { contains: category as string, mode: 'insensitive' }
      };
    }

    if (wallet) {
      whereClause.wallet = {
        name: { contains: wallet as string, mode: 'insensitive' }
      };
    }

    if (minAmount || maxAmount) {
      whereClause.amount = {};
      if (minAmount) whereClause.amount.gte = Number(minAmount);
      if (maxAmount) whereClause.amount.lte = Number(maxAmount);
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate as string);
      if (endDate) whereClause.date.lte = new Date(endDate as string);
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        category: true,
        wallet: true,
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: {
        [sortBy as string]: sortOrder as string
      }
    });

    // Format Decimal objects to numbers for client safety
    const formatted = transactions.map(t => ({
      id: t.id,
      title: t.title,
      amount: Number(t.amount),
      type: t.type,
      date: t.date,
      paymentMethod: t.paymentMethod,
      tags: t.tags,
      notes: t.notes,
      creator: t.user,
      category: {
        id: t.category.id,
        name: t.category.name,
        color: t.category.color,
        icon: t.category.icon
      },
      wallet: {
        id: t.wallet.id,
        name: t.wallet.name,
        type: t.wallet.type,
        color: t.wallet.color
      }
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Global search endpoint failure:', err);
    res.status(500).json({ error: 'Search execution failed' });
  }
});

export default router;
