import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { requireWorkspaceRole, WorkspaceRequest } from '../middleware/rbac';
import { logAction } from '../services/audit/log';

const router = Router();

// GET /api/v1/workspaces - List all workspaces user belongs to
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: req.user.id },
      include: {
        workspace: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatar: true }
                }
              }
            }
          }
        }
      }
    });

    const workspaces = memberships.map(m => ({
      id: m.workspace.id,
      name: m.workspace.name,
      type: m.workspace.type,
      userRole: m.role,
      members: m.workspace.members.map(mem => ({
        id: mem.user.id,
        name: mem.user.name,
        email: mem.user.email,
        avatar: mem.user.avatar,
        role: mem.role,
        joinedAt: mem.joinedAt
      }))
    }));

    res.json(workspaces);
  } catch (err) {
    console.error('List workspaces error:', err);
    res.status(500).json({ error: 'Failed to list workspaces' });
  }
});

// POST /api/v1/workspaces - Create new workspace
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { name, type = 'FAMILY' } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    const ws = await prisma.workspace.create({
      data: {
        name: name.trim(),
        type,
        members: {
          create: {
            userId: req.user.id,
            role: 'OWNER'
          }
        }
      },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    });

    await logAction(req.user.id, ws.id, 'WORKSPACE_CREATE', 'Workspace', ws.id, null, { name, type });

    res.status(201).json({
      id: ws.id,
      name: ws.name,
      type: ws.type,
      userRole: 'OWNER'
    });
  } catch (err) {
    console.error('Create workspace error:', err);
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

// POST /api/v1/workspaces/:id/invite - Invite a user to the workspace
router.post('/:id/invite', authenticate, requireWorkspaceRole(['OWNER', 'ADMIN']), async (req: WorkspaceRequest, res: Response) => {
  try {
    const { email, role = 'VIEWER' } = req.body;
    const workspaceId = req.params.id as string;

    if (!email) return res.status(400).json({ error: 'Invitee email is required' });
    if (!['ADMIN', 'EDITOR', 'VIEWER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid workspace role specification' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'No user registered with this email address' });
    }

    // Check if user is already a member
    const existing = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUser.id
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'User is already a member of this workspace' });
    }

    const membership = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: targetUser.id,
        role
      },
      include: {
        user: true
      }
    });

    await logAction(
      req.user!.id,
      workspaceId,
      'WORKSPACE_MEMBER_INVITE',
      'WorkspaceMember',
      membership.id,
      null,
      { invitedUser: email, role }
    );

    res.status(201).json({
      success: true,
      member: {
        id: membership.user.id,
        name: membership.user.name,
        email: membership.user.email,
        role: membership.role
      }
    });
  } catch (err) {
    console.error('Invite member error:', err);
    res.status(500).json({ error: 'Failed to invite member' });
  }
});

// PUT /api/v1/workspaces/:id/members/:userId - Update member role
router.put('/:id/members/:userId', authenticate, requireWorkspaceRole(['OWNER', 'ADMIN']), async (req: WorkspaceRequest, res: Response) => {
  try {
    const { role } = req.body;
    const workspaceId = req.params.id as string;
    const targetUserId = req.params.userId as string;

    if (!['ADMIN', 'EDITOR', 'VIEWER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid workspace role' });
    }

    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUserId
        }
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found in workspace' });
    }

    if (member.role === 'OWNER') {
      return res.status(400).json({ error: 'Cannot change OWNER role' });
    }

    const prevRole = member.role;
    const updated = await prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUserId
        }
      },
      data: { role }
    });

    await logAction(
      req.user!.id,
      workspaceId,
      'WORKSPACE_MEMBER_ROLE_UPDATE',
      'WorkspaceMember',
      updated.id,
      { role: prevRole },
      { role }
    );

    res.json({ success: true, role: updated.role });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

// DELETE /api/v1/workspaces/:id/members/:userId - Remove member
router.delete('/:id/members/:userId', authenticate, requireWorkspaceRole(['OWNER', 'ADMIN']), async (req: WorkspaceRequest, res: Response) => {
  try {
    const workspaceId = req.params.id as string;
    const targetUserId = req.params.userId as string;

    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUserId
        }
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found in workspace' });
    }

    if (member.role === 'OWNER') {
      return res.status(400).json({ error: 'Cannot remove OWNER of workspace' });
    }

    await prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUserId
        }
      }
    });

    await logAction(
      req.user!.id,
      workspaceId,
      'WORKSPACE_MEMBER_REMOVE',
      'WorkspaceMember',
      member.id,
      { userId: targetUserId, role: member.role },
      null
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// GET /api/v1/workspaces/:id/audit-logs - View audit logs
router.get('/:id/audit-logs', authenticate, requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']), async (req: WorkspaceRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { workspaceId: req.workspaceId },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load audit logs' });
  }
});

export default router;
