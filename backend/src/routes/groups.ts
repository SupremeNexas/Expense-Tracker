import { Router, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { prisma } from '../db/prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { Prisma } from '@prisma/client';
import { validate } from '../middleware/validation';
import { calculateSplits, calculateNetPositions, simplifyGroupDebts, SplitParticipantInput } from '../services/splits/splitEngine';

const router = Router();

interface GroupRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
  Locals extends Record<string, any> = Record<string, any>
> extends AuthenticatedRequest<P, ResBody, ReqBody, ReqQuery, Locals> {
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

// GET GROUP DETAILS (Members & Balances & Expenses & Settlements & Debt Simplification)
router.get('/:id', authenticate, verifyMember, async (req: GroupRequest, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const authUserId = req.user!.id;

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

    // Pairwise Balances Calculation
    const balances: { [key: string]: { [key: string]: number } } = {};
    group.members.forEach((m: any) => {
      balances[m.id] = {};
      group.members.forEach((m2: any) => {
        if (m.id !== m2.id) balances[m.id][m2.id] = 0;
      });
    });

    expenses.forEach((e: any) => {
      const payerId = e.paidById;
      e.splits.forEach((split: any) => {
        const borrowerId = split.userId;
        const amount = Number(split.amountOwed);
        if (payerId !== borrowerId && balances[borrowerId] && balances[borrowerId][payerId] !== undefined) {
          balances[borrowerId][payerId] += amount;
          balances[payerId][borrowerId] -= amount;
        }
      });
    });

    settlements.forEach((s: any) => {
      const payerId = s.paidById;
      const payeeId = s.paidToId;
      const amount = Number(s.amount);
      if (balances[payerId] && balances[payerId][payeeId] !== undefined) {
        balances[payerId][payeeId] -= amount;
        balances[payeeId][payerId] += amount;
      }
    });

    Object.keys(balances).forEach(u1 => {
      Object.keys(balances[u1]).forEach(u2 => {
        balances[u1][u2] = Math.round(balances[u1][u2] * 100) / 100;
        if (Math.abs(balances[u1][u2]) < 0.01) balances[u1][u2] = 0;
      });
    });

    // Prepare data structures for splitEngine helpers
    const mappedMembers = group.members.map((m: any) => ({ id: m.id, name: m.name }));
    const mappedExpenses = expenses.map((e: any) => ({
      paidById: e.paidById,
      amount: Number(e.amount),
      splits: e.splits.map((s: any) => ({ userId: s.userId, amountOwed: Number(s.amountOwed) }))
    }));
    const mappedSettlements = settlements.map((s: any) => ({
      paidById: s.paidById,
      paidToId: s.paidToId,
      amount: Number(s.amount)
    }));

    const netPositionsMap = calculateNetPositions(mappedMembers, mappedExpenses, mappedSettlements);
    const netPositionsObj: { [userId: string]: number } = {};
    netPositionsMap.forEach((val, uid) => {
      netPositionsObj[uid] = val;
    });

    const simplifiedDebts = simplifyGroupDebts(mappedMembers, mappedExpenses, mappedSettlements);

    // Summary calculations
    const totalGroupSpent = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    const userNetPosition = netPositionsObj[authUserId] || 0;

    let userOwes = 0;
    let userIsOwed = 0;
    if (balances[authUserId]) {
      Object.values(balances[authUserId]).forEach(val => {
        if (val > 0) userOwes += val;
        if (val < 0) userIsOwed += Math.abs(val);
      });
    }

    res.json({
      group: { id: group.id, name: group.name, created_by: group.createdBy, created_at: group.createdAt },
      members: group.members.map((m: any) => ({ id: m.id, name: m.name, email: m.email })),
      expenses: expenses.map((e: any) => ({
        id: e.id,
        title: e.title,
        amount: Number(e.amount),
        date: e.date,
        paid_by: e.paidById,
        paid_by_name: e.paidBy.name,
        splits: e.splits.map((s: any) => ({ user_id: s.userId, amount_owed: Number(s.amountOwed) }))
      })),
      settlements: settlements.map((s: any) => ({
        id: s.id,
        amount: Number(s.amount),
        date: s.date,
        paid_by: s.paidById,
        paid_by_name: s.paidBy.name,
        paid_to: s.paidToId,
        paid_to_name: s.paidTo.name,
        notes: s.notes || null
      })),
      balances,
      net_positions: netPositionsObj,
      simplified_debts: simplifiedDebts,
      summary: {
        total_spent: Math.round(totalGroupSpent * 100) / 100,
        user_net_position: Math.round(userNetPosition * 100) / 100,
        user_owes: Math.round(userOwes * 100) / 100,
        user_is_owed: Math.round(userIsOwed * 100) / 100
      }
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
  body('paid_by_user_id').notEmpty().withMessage('Payer required'),
  body('split_type').optional().isIn(['equal', 'exact', 'percentage', 'shares']).withMessage('Invalid split type')
], validate, async (req: GroupRequest, res: Response) => {
  try {
    const { title, amount, date, paid_by_user_id, split_type, split_values, splits: rawSplits } = req.body;
    const groupMemberIds = new Set(req.group.members.map((m: any) => m.id));

    if (!groupMemberIds.has(paid_by_user_id)) {
      return res.status(400).json({ error: 'Payer not in group' });
    }

    let calculatedSplits: Array<{ userId: string; amountOwed: number }> = [];

    if (split_type) {
      const participants: string[] = split_values
        ? split_values.map((v: any) => v.userId || v.user_id)
        : req.group.members.map((m: any) => m.id);

      // Verify all participants are group members
      for (const pid of participants) {
        if (!groupMemberIds.has(pid)) {
          return res.status(400).json({ error: 'All split participants must belong to the group' });
        }
      }

      const inputValues: SplitParticipantInput[] | undefined = split_values
        ? split_values.map((v: any) => ({
            userId: v.userId || v.user_id,
            amount: v.amount,
            percentage: v.percentage,
            shares: v.shares
          }))
        : undefined;

      try {
        calculatedSplits = calculateSplits(
          Number(amount),
          paid_by_user_id,
          participants,
          split_type,
          inputValues
        );
      } catch (splitError: any) {
        return res.status(400).json({ error: splitError.message || 'Invalid split configuration' });
      }
    } else if (Array.isArray(rawSplits) && rawSplits.length > 0) {
      for (const s of rawSplits) {
        const uid = s.user_id || s.userId;
        if (!groupMemberIds.has(uid)) {
          return res.status(400).json({ error: 'All split participants must belong to the group' });
        }
        calculatedSplits.push({
          userId: uid,
          amountOwed: Math.round(Number(s.amount_owed || s.amountOwed || 0) * 100) / 100
        });
      }

      const splitTotal = calculatedSplits.reduce((sum, s) => sum + Math.round(s.amountOwed * 100), 0);
      const totalCents = Math.round(Number(amount) * 100);
      if (Math.abs(splitTotal - totalCents) > 1) {
        return res.status(400).json({ error: 'Splits must add up to total amount' });
      }
    } else {
      // Default to equal split among all group members
      const participants = req.group.members.map((m: any) => m.id);
      calculatedSplits = calculateSplits(Number(amount), paid_by_user_id, participants, 'equal');
    }

    const expense = await prisma.groupExpense.create({
      data: {
        groupId: req.params.id as string,
        paidById: paid_by_user_id,
        title,
        amount: new Prisma.Decimal(Number(amount)),
        date: date ? new Date(date) : new Date(),
        splits: {
          create: calculatedSplits.map(s => ({
            userId: s.userId,
            amountOwed: new Prisma.Decimal(s.amountOwed)
          }))
        }
      },
      include: {
        splits: true
      }
    });

    res.status(201).json({
      message: 'Expense added',
      id: expense.id,
      splits: expense.splits.map(s => ({ user_id: s.userId, amount_owed: Number(s.amountOwed) }))
    });
  } catch (err) {
    console.error('Error adding group expense:', err);
    res.status(500).json({ error: 'Failed to add group expense' });
  }
});

// RECORD SETTLEMENT (with debt validation & notes)
router.post('/:id/settlements', authenticate, verifyMember, [
  body('paid_to_user_id').notEmpty().withMessage('Payee required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount required'),
  body('notes').optional().isString()
], validate, async (req: GroupRequest, res: Response) => {
  try {
    const paidBy = req.user!.id;
    const paidTo = req.body.paid_to_user_id;
    const settleAmount = Math.round(Number(req.body.amount) * 100) / 100;
    const notes = req.body.notes ? String(req.body.notes).trim() : null;

    if (!req.group.members.some((m: any) => m.id === paidTo)) {
      return res.status(400).json({ error: 'Payee not in group' });
    }

    // Fetch existing group expenses and settlements to compute current debt between paidBy and paidTo
    const expenses = await prisma.groupExpense.findMany({
      where: { groupId: req.params.id as string },
      include: { splits: true }
    });

    const settlements = await prisma.groupSettlement.findMany({
      where: { groupId: req.params.id as string }
    });

    let currentOwedToPayee = 0;

    expenses.forEach(e => {
      if (e.paidById === paidTo) {
        const mySplit = e.splits.find(s => s.userId === paidBy);
        if (mySplit) {
          currentOwedToPayee += Number(mySplit.amountOwed);
        }
      } else if (e.paidById === paidBy) {
        const payeeSplit = e.splits.find(s => s.userId === paidTo);
        if (payeeSplit) {
          currentOwedToPayee -= Number(payeeSplit.amountOwed);
        }
      }
    });

    settlements.forEach(s => {
      if (s.paidById === paidBy && s.paidToId === paidTo) {
        currentOwedToPayee -= Number(s.amount);
      } else if (s.paidById === paidTo && s.paidToId === paidBy) {
        currentOwedToPayee += Number(s.amount);
      }
    });

    currentOwedToPayee = Math.round(currentOwedToPayee * 100) / 100;

    if (currentOwedToPayee <= 0) {
      return res.status(400).json({ error: 'No outstanding debt to payee in this group to settle' });
    }

    if (settleAmount > Math.round((currentOwedToPayee + 0.005) * 100) / 100) {
      return res.status(400).json({
        error: `Settlement amount ($${settleAmount.toFixed(2)}) exceeds outstanding group debt of $${currentOwedToPayee.toFixed(2)}`
      });
    }

    const settlement = await prisma.groupSettlement.create({
      data: {
        groupId: req.params.id as string,
        paidById: paidBy,
        paidToId: paidTo,
        amount: new Prisma.Decimal(settleAmount),
        date: req.body.date ? new Date(req.body.date) : new Date(),
        notes
      }
    });

    const remainingDebt = Math.max(0, Math.round((currentOwedToPayee - settleAmount) * 100) / 100);

    res.status(201).json({
      message: 'Settlement recorded',
      settlement: {
        id: settlement.id,
        groupId: settlement.groupId,
        paidById: settlement.paidById,
        paidToId: settlement.paidToId,
        amount: Number(settlement.amount),
        date: settlement.date,
        notes: settlement.notes
      },
      previous_balance: currentOwedToPayee,
      remaining_balance: remainingDebt,
      is_fully_settled: remainingDebt === 0
    });
  } catch (err) {
    console.error('Error recording settlement:', err);
    res.status(500).json({ error: 'Failed to record settlement' });
  }
});

// GET SIMPLIFIED DEBTS
router.get('/:id/simplified-debts', authenticate, verifyMember, async (req: GroupRequest, res: Response) => {
  try {
    const groupId = req.params.id as string;

    const group: any = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { select: { id: true, name: true } } }
    });

    if (!group) return res.status(404).json({ error: 'Group not found' });

    const expenses: any[] = await prisma.groupExpense.findMany({
      where: { groupId },
      include: { splits: true }
    });

    const settlements: any[] = await prisma.groupSettlement.findMany({
      where: { groupId }
    });

    const mappedMembers = group.members.map((m: any) => ({ id: m.id, name: m.name }));
    const mappedExpenses = expenses.map((e: any) => ({
      paidById: e.paidById,
      amount: Number(e.amount),
      splits: e.splits.map((s: any) => ({ userId: s.userId, amountOwed: Number(s.amountOwed) }))
    }));
    const mappedSettlements = settlements.map((s: any) => ({
      paidById: s.paidById,
      paidToId: s.paidToId,
      amount: Number(s.amount)
    }));

    const simplifiedDebts = simplifyGroupDebts(mappedMembers, mappedExpenses, mappedSettlements);

    res.json({ simplified_debts: simplifiedDebts });
  } catch (err) {
    console.error('Error getting simplified debts:', err);
    res.status(500).json({ error: 'Failed to fetch simplified debts' });
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
