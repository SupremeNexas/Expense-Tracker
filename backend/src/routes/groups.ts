import { Router, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { prisma } from '../db/prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { Prisma } from '@prisma/client';
import { validate } from '../middleware/validation';

const router = Router();

interface GroupRequest extends AuthenticatedRequest {
  group?: any;
}

// Middleware to verify group membership
const verifyMember = async (req: GroupRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const group = await prisma.group.findUnique({
      where: { id: req.params.id as string },
      include: { members: true }
    });

    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.members.some(m => m.id === req.user!.id)) {
      return res.status(403).json({ error: 'Not a group member' });
    }

    req.group = group as any;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify membership' });
  }
};

// Separate middleware to verify the requester is the group owner
const verifyGroupOwner = async (req: GroupRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const group = await prisma.group.findUnique({
      where: { id: req.params.id as string },
      include: { members: true }
    });

    if (!group) return res.status(404).json({ error: 'Group not found' });
    req.group = group as any;

    if (group.createdBy !== req.user!.id) {
      return res.status(403).json({ error: 'Only the group owner can perform this action' });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify group ownership' });
  }
};

// Middleware to verify the requester is the group owner (used after verifyMember or verifyGroupOwner)
const verifyOwner = (req: GroupRequest, res: Response, next: NextFunction) => {
  if (!req.group) return res.status(404).json({ error: 'Group not found' });
  if (req.group.createdBy !== req.user!.id) {
    return res.status(403).json({ error: 'Only the group owner can perform this action' });
  }
  next();
};

// CREATE GROUP
router.post('/', authenticate, [
  body('name').trim().notEmpty().withMessage('Group name required')
], validate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { name } = req.body;

    const group = await prisma.group.create({
      data: {
        name,
        createdBy: req.user.id,
        members: {
          connect: [{ id: req.user.id }]
        }
      }
    });

    res.status(201).json({
      id: group.id,
      name: group.name,
      created_by: group.createdBy,
      created_at: group.createdAt
    });
  } catch (err) {
    console.error('Error creating group:', err);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// GET MY GROUPS
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: { id: req.user.id }
        }
      },
      include: {
        members: true
      }
    });

    const mapped = groups.map(g => ({
      id: g.id,
      name: g.name,
      created_by: g.createdBy,
      created_at: g.createdAt,
      member_count: g.members.length
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// GET GROUP DETAILS (Members & Balances & Expenses & Settlements)
router.get('/:id', authenticate, verifyMember, async (req: GroupRequest, res: Response) => {
  try {
    const groupId = req.params.id as string;

    const group: any = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: { select: { id: true, name: true, email: true } }
      }
    });

    if (!group) return res.status(404).json({ error: 'Group not found' });

    const expenses: any[] = await prisma.groupExpense.findMany({
      where: { groupId },
      include: {
        paidBy: { select: { id: true, name: true } },
        splits: true
      },
      orderBy: { date: 'desc' }
    });

    const settlements: any[] = await prisma.groupSettlement.findMany({
      where: { groupId },
      include: {
        paidBy: { select: { id: true, name: true } },
        paidTo: { select: { id: true, name: true } }
      },
      orderBy: { date: 'desc' }
    });

    // Calculate Balances
    const balances: { [key: string]: { [key: string]: number } } = {};
    group.members.forEach(m => {
      balances[m.id] = {};
      group.members.forEach(m2 => {
        if (m.id !== m2.id) balances[m.id][m2.id] = 0;
      });
    });

    // Process expenses
    expenses.forEach(e => {
      const payerId = e.paidById;
      e.splits.forEach(split => {
        const borrowerId = split.userId;
        const amount = Number(split.amountOwed);
        if (payerId !== borrowerId && balances[borrowerId] && balances[borrowerId][payerId] !== undefined) {
          balances[borrowerId][payerId] += amount;
          balances[payerId][borrowerId] -= amount;
        }
      });
    });

    // Process settlements
    settlements.forEach(s => {
      const payerId = s.paidById;
      const payeeId = s.paidToId;
      const amount = Number(s.amount);
      if (balances[payerId] && balances[payerId][payeeId] !== undefined) {
        balances[payerId][payeeId] -= amount;
        balances[payeeId][payerId] += amount;
      }
    });

    // Round balances to 2 decimal places to fix floating point issues
    Object.keys(balances).forEach(u1 => {
      Object.keys(balances[u1]).forEach(u2 => {
        balances[u1][u2] = Math.round(balances[u1][u2] * 100) / 100;
        if (Math.abs(balances[u1][u2]) < 0.01) balances[u1][u2] = 0;
      });
    });

    res.json({
      group: { id: group.id, name: group.name, created_by: group.createdBy, created_at: group.createdAt },
      members: group.members.map(m => ({ id: m.id, name: m.name, email: m.email })),
      expenses: expenses.map(e => ({
        id: e.id,
        title: e.title,
        amount: Number(e.amount),
        date: e.date,
        paid_by: e.paidById,
        paid_by_name: e.paidBy.name,
        splits: e.splits.map(s => ({ user_id: s.userId, amount_owed: Number(s.amountOwed) }))
      })),
      settlements: settlements.map(s => ({
        id: s.id,
        amount: Number(s.amount),
        date: s.date,
        paid_by: s.paidById,
        paid_by_name: s.paidBy.name,
        paid_to: s.paidToId,
        paid_to_name: s.paidTo.name
      })),
      balances
    });
  } catch (err) {
    console.error('Error fetching group details:', err);
    res.status(500).json({ error: 'Failed to fetch group details' });
  }
});

// ADD MEMBER (Using email) — owner only
router.post('/:id/members', authenticate, verifyGroupOwner, [
  body('email').trim().notEmpty().withMessage('Email required')
], validate, async (req: GroupRequest, res: Response) => {
  try {
    const email = req.body.email;

    // Normalize email: trim whitespace and convert to lowercase for consistent lookups
    const normalizedEmail = email.trim().toLowerCase();

    const userToAdd = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    if (!userToAdd) return res.status(404).json({ error: 'User not found with this email' });

    if (req.group.members.some((m: any) => m.id === userToAdd.id)) {
      return res.status(400).json({ error: 'User already in group' });
    }

    await prisma.group.update({
      where: { id: req.params.id as string },
      data: {
        members: {
          connect: { id: userToAdd.id }
        }
      }
    });

    res.json({
      message: 'Member added',
      member: { id: userToAdd.id, name: userToAdd.name, email: userToAdd.email }
    });
  } catch (err) {
    console.error('Error adding member:', err);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// ADD GROUP EXPENSE
router.post('/:id/expenses', authenticate, verifyMember, [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount required'),
  body('date').notEmpty(),
  body('paid_by_user_id').notEmpty(),
  body('splits').isArray({ min: 1 })
], validate, async (req: GroupRequest, res: Response) => {
  try {
    const { title, amount, date, paid_by_user_id, splits } = req.body;

    // Verify payer is in group
    if (!req.group.members.some((m: any) => m.id === paid_by_user_id)) {
      return res.status(400).json({ error: 'Payer not in group' });
    }

    // Verify splits total == amount
    const splitTotal = splits.reduce((sum: number, s: any) => sum + Number(s.amount_owed), 0);
    if (Math.abs(splitTotal - amount) > 0.01) {
      return res.status(400).json({ error: 'Splits must add up to total amount' });
    }

    const expense = await prisma.groupExpense.create({
      data: {
        groupId: req.params.id as string,
        paidById: paid_by_user_id,
        title,
        amount: new Prisma.Decimal(Number(amount)),
        date: new Date(date),
        splits: {
          create: splits.map((s: any) => ({
            userId: s.user_id,
            amountOwed: new Prisma.Decimal(Number(s.amount_owed))
          }))
        }
      }
    });

    res.status(201).json({ message: 'Expense added', id: expense.id });
  } catch (err) {
    console.error('Error adding group expense:', err);
    res.status(500).json({ error: 'Failed to add group expense' });
  }
});

// RECORD SETTLEMENT
router.post('/:id/settlements', authenticate, verifyMember, [
  body('paid_to_user_id').notEmpty(),
  body('amount').isFloat({ min: 0.01 }),
  body('date').notEmpty()
], validate, async (req: GroupRequest, res: Response) => {
  try {
    const paidBy = req.user!.id;
    const paidTo = req.body.paid_to_user_id;

    if (!req.group.members.some((m: any) => m.id === paidTo)) {
      return res.status(400).json({ error: 'Payee not in group' });
    }

    await prisma.groupSettlement.create({
      data: {
        groupId: req.params.id as string,
        paidById: paidBy,
        paidToId: paidTo,
        amount: new Prisma.Decimal(Number(req.body.amount)),
        date: new Date(req.body.date)
      }
    });

    res.status(201).json({ message: 'Settlement recorded' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record settlement' });
  }
});

// DELETE GROUP
router.delete('/:id', authenticate, verifyMember, async (req: GroupRequest, res: Response) => {
  try {
    const groupId = req.params.id as string;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true }
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    // Delete dependent records first
    await prisma.groupSettlement.deleteMany({ where: { groupId } });
    await prisma.groupExpense.deleteMany({ where: { groupId } });

    // Disconnect all members (members is an implicit many-to-many relation,
    // there is no separate GroupMember model to delete directly)
    await prisma.group.update({
      where: { id: groupId },
      data: { members: { set: [] } }
    });

    await prisma.group.delete({ where: { id: groupId } });

    res.json({ message: 'Group deleted', deletedGroupId: groupId });
  } catch (err) {
    console.error('Error deleting group:', err);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

export default router;
