import { Router, Response } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { prisma } from '../db/prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

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

    res.json({ friends: friendships });
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

    await prisma.friend.delete({
      where: { id: friendshipId }
    });

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

export default router;