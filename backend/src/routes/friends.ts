import { Router, Response } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { prisma } from '../db/prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { Prisma } from '@prisma/client';
import { calculateSplits } from '../services/splits/splitEngine';

const router = Router();

/**
 * GET /api/friends
 * Get all friends (accepted friendships) for authenticated user
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const friendships = await prisma.friend.findMany({
      where: {
        OR: [
          { fromUserId: userId },
          { toUserId: userId }
        ],
        status: 'ACCEPTED'
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        toUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    // Fetch friend balances for each friend
    const friendBalances = await prisma.friendBalance.findMany({
      where: {
        OR: [
          { fromUserId: userId },
          { toUserId: userId }
        ]
      }
    });

    // Build balance map: { [friendUserId]: { you_owe: number, owed_to_you: number, net: number } }
    const balanceMap: { [key: string]: { you_owe: number; owed_to_you: number; net: number } } = {};
    friendBalances.forEach(bal => {
      const friendId = bal.fromUserId === userId ? bal.toUserId : bal.fromUserId;
      if (!balanceMap[friendId]) {
        balanceMap[friendId] = { you_owe: 0, owed_to_you: 0, net: 0 };
      }
      const amount = Number(bal.amount);
      if (bal.fromUserId === userId) {
        // You owe them
        balanceMap[friendId].you_owe += amount;
        balanceMap[friendId].net -= amount;
      } else {
        // They owe you
        balanceMap[friendId].owed_to_you += amount;
        balanceMap[friendId].net += amount;
      }
    });

    // Round balances to 2 decimal places
    Object.keys(balanceMap).forEach(fid => {
      balanceMap[fid].you_owe = Math.round(balanceMap[fid].you_owe * 100) / 100;
      balanceMap[fid].owed_to_you = Math.round(balanceMap[fid].owed_to_you * 100) / 100;
      balanceMap[fid].net = Math.round(balanceMap[fid].net * 100) / 100;
    });

    const friendsWithBalances = friendships.map(friendship => {
      const friendInfo = getFriendInfo(friendship, userId);
      return {
        ...friendship,
        balance: balanceMap[friendInfo.id] || { you_owe: 0, owed_to_you: 0, net: 0 }
      };
    });

    function getFriendInfo(friendship: any, userId: string) {
      if (friendship.fromUserId === userId) {
        return {
          id: friendship.toUserId,
          name: friendship.toUser?.name || 'Friend',
          email: friendship.toUser?.email || '',
          avatar: friendship.toUser?.avatar || null
        };
      }
      return {
        id: friendship.fromUserId,
        name: friendship.fromUser?.name || 'Friend',
        email: friendship.fromUser?.email || '',
        avatar: friendship.fromUser?.avatar || null
      };
    }

    res.json({ friends: friendsWithBalances });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

/**
 * GET /api/friends/pending
 * Get pending friend requests for authenticated user
 */
router.get('/pending', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const pendingRequests = await prisma.friend.findMany({
      where: {
        toUserId: userId,
        status: 'PENDING'
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    res.json({ pendingRequests });
  } catch (error) {
    console.error('Get pending friends error:', error);
    res.status(500).json({ error: 'Failed to fetch pending friend requests' });
  }
});

/**
 * POST /api/friends
 * Send a friend request by email or toUserId
 * Body: { toUserId?: string, email?: string }
 */
router.post('/', authenticate, [
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('toUserId').optional().notEmpty()
], validate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { toUserId, email } = req.body;
    const fromUserId = req.user!.id;

    let targetUserId = toUserId;

    if (!targetUserId && email) {
      const user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() }
      });
      if (!user) {
        return res.status(404).json({ error: 'User not found with this email' });
      }
      targetUserId = user.id;
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'Either toUserId or email is required' });
    }

    // Prevent self-friending
    if (targetUserId === fromUserId) {
      return res.status(400).json({ error: 'You cannot add yourself as a friend' });
    }

    // Check if friendship already exists (in any direction)
    const existing = await prisma.friend.findFirst({
      where: {
        OR: [
          { fromUserId, toUserId: targetUserId },
          { fromUserId: targetUserId, toUserId: fromUserId }
        ]
      }
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return res.status(400).json({ error: 'You are already friends with this user' });
      }
      if (existing.status === 'PENDING') {
        if (existing.fromUserId === fromUserId) {
          return res.status(400).json({ error: 'Friend request already sent' });
        } else {
          // B has already sent request to A, let's accept it!
          const updated = await prisma.friend.update({
            where: { id: existing.id },
            data: { status: 'ACCEPTED', acknowledged: true }
          });
          return res.json({ message: 'Friend request accepted automatically', friendship: updated });
        }
      }
      // If rejected, we can let user send a request again (reset to PENDING)
      const updated = await prisma.friend.update({
        where: { id: existing.id },
        data: { status: 'PENDING', fromUserId, toUserId: targetUserId, acknowledged: false }
      });
      return res.status(201).json({ message: 'Friend request sent successfully', friendship: updated });
    }

    // Create pending friend request
    const friendship = await prisma.friend.create({
      data: {
        fromUserId,
        toUserId: targetUserId,
        status: 'PENDING',
        acknowledged: false
      }
    });

    res.status(201).json({
      message: 'Friend request sent successfully',
      friendship
    });
  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

/**
 * PUT /api/friends/:id/accept
 * Accept a friend request
 */
router.put('/:id/accept', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const friendshipId = req.params.id as string;

    // Check if friendship exists
    const friendship = await prisma.friend.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Verify the request is for this user
    if (friendship.toUserId !== req.user!.id) {
      return res.status(403).json({ error: 'You can only accept your own friend requests' });
    }

    // Check if already accepted
    if (friendship.status === 'ACCEPTED') {
      return res.status(400).json({ error: 'Friend request already accepted' });
    }

    // Update to accepted
    const updated = await prisma.friend.update({
      where: { id: friendshipId },
      data: { status: 'ACCEPTED', acknowledged: true }
    });

    res.json({ message: 'Friend request accepted', friendship: updated });
  } catch (error) {
    console.error('Accept friend error:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

/**
 * PUT /api/friends/:id/reject
 * Reject a friend request
 */
router.put('/:id/reject', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const friendshipId = req.params.id as string;

    // Check if friendship exists
    const friendship = await prisma.friend.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Verify the request is for this user
    if (friendship.toUserId !== req.user!.id) {
      return res.status(403).json({ error: 'You can only reject your own friend requests' });
    }

    const updated = await prisma.friend.update({
      where: { id: friendshipId },
      data: { status: 'REJECTED', acknowledged: true }
    });

    res.json({ message: 'Friend request rejected', friendship: updated });
  } catch (error) {
    console.error('Reject friend error:', error);
    res.status(500).json({ error: 'Failed to reject friend request' });
  }
});

/**
 * DELETE /api/friends/:id
 * Remove a friend
 */
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const friendshipId = req.params.id as string;

    // Check if friendship exists
    const friendship = await prisma.friend.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    // Verify the user is part of this friendship
    if (friendship.fromUserId !== req.user!.id && friendship.toUserId !== req.user!.id) {
      return res.status(403).json({ error: 'You can only remove your own friendships' });
    }

    // Delete friend balances associated with this friendship
    const friendUserIds = [friendship.fromUserId, friendship.toUserId];
    await prisma.friendBalance.deleteMany({
      where: {
        OR: [
          { fromUserId: friendUserIds[0], toUserId: friendUserIds[1] },
          { fromUserId: friendUserIds[1], toUserId: friendUserIds[0] }
        ]
      }
    });

    await prisma.friend.delete({
      where: { id: friendshipId }
    });

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

/**
 * GET /api/friends/balances
 * Get all friend balances for the authenticated user (Splitwise-style)
 */
router.get('/balances', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get all friend balances where user is either debtor or creditor
    const balances = await prisma.friendBalance.findMany({
      where: {
        OR: [
          { fromUserId: userId },
          { toUserId: userId }
        ]
      },
      include: {
        fromUser: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        toUser: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    // Transform to Splitwise-style response
    const friendBalances = balances.map(b => {
      const isOwed = b.toUserId === userId;
      return {
        id: b.id,
        friend: isOwed ? b.fromUser : b.toUser,
        net_balance: isOwed ? Number(b.amount) : -Number(b.amount),
        currency: b.currency,
        updated_at: b.updatedAt
      };
    });

    res.json({ balances: friendBalances });
  } catch (error) {
    console.error('Get friend balances error:', error);
    res.status(500).json({ error: 'Failed to fetch friend balances' });
  }
});

/**
 * POST /api/friends/:id/expense
 * Add a shared expense with a friend (Simplified Splitwise-style)
 * Body: { title, amount, paid_by_user_id, split_type, split_value }
 * split_type: 'equal' | 'exact' | 'percentage' | 'shares'
 * For equal: just pass the expense, it splits 50/50
 * For exact: split_value is array of exact amounts [{user_id: string, amount: number}]
 * For percentage: split_value is array of percentages [{user_id: string, percentage: number}]
 * For shares: split_value is array of shares [{user_id: string, shares: number}]
 */
router.post('/:id/expense', authenticate, [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount required'),
  body('paid_by_user_id').notEmpty().withMessage('Payer required'),
  body('split_type').isIn(['equal', 'exact', 'percentage', 'shares']).withMessage('Invalid split type')
], validate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const friendshipId = req.params.id as string;
    const { title, amount, paid_by_user_id, split_type, split_value, date } = req.body;
    const userId = req.user!.id;

    // Verify friendship exists and is accepted
    const friendship = await prisma.friend.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    if (friendship.status !== 'ACCEPTED') {
      return res.status(400).json({ error: 'Must be friends to add shared expense' });
    }

    // Verify both users are part of this friendship
    const friendId = friendship.fromUserId === userId ? friendship.toUserId : friendship.fromUserId;
    const participants = [userId, friendId];

    if (!participants.includes(paid_by_user_id)) {
      return res.status(400).json({ error: 'Payer must be a participant' });
    }

    const expenseDate = date ? new Date(date) : new Date();

    // Calculate splits based on split_type
    let owedAmount: number;
    let splits: { userId: string; amount: number }[] = [];

    if (split_type === 'equal') {
      // 50/50 split
      owedAmount = Number(amount) / 2;
      splits = participants.map(pId => ({
        userId: pId,
        amount: pId === paid_by_user_id ? 0 : owedAmount
      }));
    } else if (split_type === 'exact') {
      // Exact amounts provided
      const totalSplit = (split_value as Array<{user_id: string; amount: number}>).reduce((sum, s) => sum + Number(s.amount), 0);
      if (Math.abs(totalSplit - Number(amount)) > 0.01) {
        return res.status(400).json({ error: 'Exact splits must sum to total amount' });
      }
      splits = split_value.map(s => ({
        userId: s.user_id,
        amount: Number(s.amount)
      }));
      const payerSplit = splits.find(s => s.userId === paid_by_user_id);
      owedAmount = payerSplit ? Number(amount) - payerSplit.amount : Number(amount);
    } else if (split_type === 'percentage') {
      // Percentage split
      const totalPct = (split_value as Array<{user_id: string; percentage: number}>).reduce((sum, s) => sum + Number(s.percentage), 0);
      if (Math.abs(totalPct - 100) > 0.1) {
        return res.status(400).json({ error: 'Percentages must sum to 100' });
      }
      splits = split_value.map(s => ({
        userId: s.user_id,
        amount: (Number(amount) * Number(s.percentage)) / 100
      }));
      const payerSplit = splits.find(s => s.userId === paid_by_user_id);
      owedAmount = payerSplit ? Number(amount) - payerSplit.amount : Number(amount);
    } else if (split_type === 'shares') {
      // Shares split
      const totalShares = (split_value as Array<{user_id: string; shares: number}>).reduce((sum, s) => sum + Number(s.shares), 0);
      if (totalShares === 0) {
        return res.status(400).json({ error: 'Total shares must be greater than 0' });
      }
      splits = split_value.map(s => ({
        userId: s.user_id,
        amount: (Number(amount) * Number(s.shares)) / totalShares
      }));
      const payerSplit = splits.find(s => s.userId === paid_by_user_id);
      owedAmount = payerSplit ? Number(amount) - payerSplit.amount : Number(amount);
    }

    // Round to 2 decimal places
    owedAmount = Math.round(owedAmount * 100) / 100;

    // Update friend balance
    // If the current user paid, they are owed owedAmount
    // If the friend paid, they owe owedAmount
    const isOwed = paid_by_user_id === userId;

    if (isOwed) {
      // User paid, friend owes them
      await prisma.friendBalance.upsert({
        where: {
          fromUserId_toUserId: {
            fromUserId: friendId,
            toUserId: userId
          }
        },
        create: {
          fromUserId: friendId,
          toUserId: userId,
          amount: new Prisma.Decimal(owedAmount),
          currency: 'USD'
        },
        update: {
          amount: { increment: new Prisma.Decimal(owedAmount) }
        }
      });
    } else {
      // Friend paid, user owes them
      await prisma.friendBalance.upsert({
        where: {
          fromUserId_toUserId: {
            fromUserId: userId,
            toUserId: friendId
          }
        },
        create: {
          fromUserId: userId,
          toUserId: friendId,
          amount: new Prisma.Decimal(owedAmount),
          currency: 'USD'
        },
        update: {
          amount: { increment: new Prisma.Decimal(owedAmount) }
        }
      });
    }

    res.status(201).json({
      message: 'Shared expense added',
      net_balance: isOwed ? owedAmount : -owedAmount,
      owed_amount: owedAmount
    });
  } catch (error) {
    console.error('Add friend expense error:', error);
    res.status(500).json({ error: 'Failed to add shared expense' });
  }
});

/**
 * POST /api/friends/:id/settle
 * Settle up with a friend (full or partial settlement)
 * Body: { amount, date?, notes?, paid_by_user_id? }
 */
router.post('/:id/settle', authenticate, [
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount required'),
  body('notes').optional().isString(),
  body('date').optional().isISO8601().withMessage('Valid date format required'),
  body('paid_by_user_id').optional().isString()
], validate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const friendshipId = req.params.id as string;
    const { amount, date, notes, paid_by_user_id } = req.body;
    const authUserId = req.user!.id;

    // Verify friendship exists and is accepted
    const friendship = await prisma.friend.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    if (friendship.status !== 'ACCEPTED') {
      return res.status(400).json({ error: 'Must be friends to settle' });
    }

    // Determine payer and payee
    const participants = [friendship.fromUserId, friendship.toUserId];
    if (!participants.includes(authUserId)) {
      return res.status(403).json({ error: 'You are not a participant in this friendship' });
    }

    const payerId = paid_by_user_id || authUserId;
    if (!participants.includes(payerId)) {
      return res.status(400).json({ error: 'Payer must be one of the friends' });
    }

    const payeeId = participants.find(id => id !== payerId)!;
    const settleAmount = Math.round(Number(amount) * 100) / 100;

    // Find current balance where payer owes payee
    const balance = await prisma.friendBalance.findFirst({
      where: {
        fromUserId: payerId,
        toUserId: payeeId
      }
    });

    const outstandingBalance = balance ? Number(balance.amount) : 0;

    if (outstandingBalance <= 0) {
      return res.status(400).json({ error: 'No outstanding balance owed by payer to settle' });
    }

    if (settleAmount > Math.round((outstandingBalance + 0.005) * 100) / 100) {
      return res.status(400).json({
        error: `Settlement amount ($${settleAmount.toFixed(2)}) exceeds outstanding balance of $${outstandingBalance.toFixed(2)}`
      });
    }

    // Record settlement in FriendSettlement table
    const settlement = await prisma.friendSettlement.create({
      data: {
        friendshipId: friendship.id,
        paidById: payerId,
        paidToId: payeeId,
        amount: new Prisma.Decimal(settleAmount),
        date: date ? new Date(date) : new Date(),
        notes: notes ? notes.trim() : null
      }
    });

    // Update balance
    const remainingBalance = Math.max(0, Math.round((outstandingBalance - settleAmount) * 100) / 100);

    if (balance) {
      await prisma.friendBalance.update({
        where: { id: balance.id },
        data: { amount: new Prisma.Decimal(remainingBalance) }
      });
    }

    res.json({
      message: 'Settlement recorded successfully',
      settlement: {
        id: settlement.id,
        friendshipId: settlement.friendshipId,
        paidById: settlement.paidById,
        paidToId: settlement.paidToId,
        amount: Number(settlement.amount),
        date: settlement.date,
        notes: settlement.notes
      },
      previous_balance: outstandingBalance,
      remaining_balance: remainingBalance,
      is_fully_settled: remainingBalance === 0
    });
  } catch (error) {
    console.error('Settle with friend error:', error);
    res.status(500).json({ error: 'Failed to settle balance' });
  }
});

/**
 * GET /api/friends/:id/settlements
 * Get settlement history for a friendship
 */
router.get('/:id/settlements', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const friendshipId = req.params.id as string;
    const authUserId = req.user!.id;

    const friendship = await prisma.friend.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    if (friendship.fromUserId !== authUserId && friendship.toUserId !== authUserId) {
      return res.status(403).json({ error: 'Unauthorized access to friendship settlements' });
    }

    const settlements = await prisma.friendSettlement.findMany({
      where: { friendshipId: friendship.id },
      include: {
        paidBy: { select: { id: true, name: true, email: true, avatar: true } },
        paidTo: { select: { id: true, name: true, email: true, avatar: true } }
      },
      orderBy: { date: 'desc' }
    });

    res.json({ settlements });
  } catch (error) {
    console.error('Get friend settlements error:', error);
    res.status(500).json({ error: 'Failed to fetch settlement history' });
  }
});

/**
 * GET /api/friends/summary
 * Get total balances summary (Splitwise-style home screen)
 */
router.get('/summary', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get all balances
    const balances = await prisma.friendBalance.findMany({
      where: {
        OR: [
          { fromUserId: userId },
          { toUserId: userId }
        ]
      },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } }
      }
    });

    // Calculate totals
    let totalOwed = 0;  // Money others owe you
    let totalOwing = 0; // Money you owe others

    balances.forEach(b => {
      if (b.toUserId === userId) {
        totalOwed += Number(b.amount);
      } else {
        totalOwing += Number(b.amount);
      }
    });

    // Get friend count
    const friendCount = await prisma.friend.count({
      where: {
        OR: [{ fromUserId: userId }, { toUserId: userId }],
        status: 'ACCEPTED'
      }
    });

    res.json({
      total_owed: Math.round(totalOwed * 100) / 100,
      total_owing: Math.round(totalOwing * 100) / 100,
      net_balance: Math.round((totalOwed - totalOwing) * 100) / 100,
      friend_count: friendCount,
      balances_count: balances.length
    });
  } catch (error) {
    console.error('Get friend summary error:', error);
    res.status(500).json({ error: 'Failed to fetch friend summary' });
  }
});

export default router;