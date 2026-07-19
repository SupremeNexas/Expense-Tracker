import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authenticate } from '../middleware/auth';
import { requireWorkspaceRole, WorkspaceRequest } from '../middleware/rbac';
import { logAction } from '../services/audit/log';

const router = Router();

// GET /api/v1/automations - List all rules for the active workspace
router.get('/', authenticate, requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']), async (req: WorkspaceRequest, res: Response) => {
  try {
    const automations = await prisma.automation.findMany({
      where: { workspaceId: req.workspaceId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(automations);
  } catch (err) {
    console.error('List rules error:', err);
    res.status(500).json({ error: 'Failed to list automations' });
  }
});

// POST /api/v1/automations - Create a rule
router.post('/', authenticate, requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: WorkspaceRequest, res: Response) => {
  try {
    const { name, triggerType, conditions, actions } = req.body;

    if (!name || !triggerType || !conditions || !actions) {
      return res.status(400).json({ error: 'Name, trigger type, conditions, and actions are required' });
    }

    const rule = await prisma.automation.create({
      data: {
        workspaceId: req.workspaceId!,
        name,
        triggerType,
        conditions,
        actions
      }
    });

    await logAction(
      req.user!.id,
      req.workspaceId,
      'AUTOMATION_CREATE',
      'Automation',
      rule.id,
      null,
      { name, triggerType }
    );

    res.status(201).json(rule);
  } catch (err) {
    console.error('Create rule error:', err);
    res.status(500).json({ error: 'Failed to create automation' });
  }
});

// PUT /api/v1/automations/:id - Update rule or toggle status
router.put('/:id', authenticate, requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: WorkspaceRequest, res: Response) => {
  try {
    const { name, triggerType, conditions, actions, isActive } = req.body;
    const ruleId = req.params.id as string;

    const existing = await prisma.automation.findFirst({
      where: { id: ruleId, workspaceId: req.workspaceId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Automation rule not found' });
    }

    const updated = await prisma.automation.update({
      where: { id: ruleId },
      data: {
        name: name !== undefined ? name : existing.name,
        triggerType: triggerType !== undefined ? triggerType : existing.triggerType,
        conditions: conditions !== undefined ? conditions : existing.conditions,
        actions: actions !== undefined ? actions : existing.actions,
        isActive: isActive !== undefined ? isActive : existing.isActive
      }
    });

    await logAction(
      req.user!.id,
      req.workspaceId,
      'AUTOMATION_UPDATE',
      'Automation',
      updated.id,
      { name: existing.name, isActive: existing.isActive },
      { name: updated.name, isActive: updated.isActive }
    );

    res.json(updated);
  } catch (err) {
    console.error('Update rule error:', err);
    res.status(500).json({ error: 'Failed to update automation' });
  }
});

// DELETE /api/v1/automations/:id - Delete rule
router.delete('/:id', authenticate, requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: WorkspaceRequest, res: Response) => {
  try {
    const ruleId = req.params.id as string;

    const existing = await prisma.automation.findFirst({
      where: { id: ruleId, workspaceId: req.workspaceId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Automation rule not found' });
    }

    await prisma.automation.delete({
      where: { id: ruleId }
    });

    await logAction(
      req.user!.id,
      req.workspaceId,
      'AUTOMATION_DELETE',
      'Automation',
      ruleId,
      { name: existing.name },
      null
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Delete rule error:', err);
    res.status(500).json({ error: 'Failed to delete automation' });
  }
});

export default router;
