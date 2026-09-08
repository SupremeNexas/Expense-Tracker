import { Router, Response } from 'express';
import { requireWorkspaceRole, WorkspaceRequest } from '../middleware/rbac';
import {
  evaluateAllFinancialAlerts,
  evaluateSpendingLimits,
  evaluateBudgetAlerts,
  evaluateCreditCardAlerts,
} from '../services/alerts/alertEngine';
import { prisma } from '../db/prisma';

const router = Router();

// GET /api/alerts - Evaluate & return all authoritative financial alerts
router.get('/', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']), async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await evaluateAllFinancialAlerts(req.user.id, req.workspaceId);
    res.json(result);
  } catch (err) {
    console.error('Error calculating financial alerts:', err);
    res.status(500).json({ error: 'Failed to calculate financial alerts' });
  }
});

// GET /api/alerts/spending-limits - Returns progress on spending limits across categories & overall
router.get('/spending-limits', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']), async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });

    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;

    const { limits, alerts } = await evaluateSpendingLimits(req.user.id, req.workspaceId, month, year);
    res.json({ limits, alerts });
  } catch (err) {
    console.error('Error fetching spending limits:', err);
    res.status(500).json({ error: 'Failed to fetch spending limits' });
  }
});

// GET /api/alerts/budgets - Get detailed budget threshold evaluations
router.get('/budgets', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']), async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });

    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;

    const alerts = await evaluateBudgetAlerts(req.user.id, req.workspaceId, month, year);
    res.json(alerts);
  } catch (err) {
    console.error('Error fetching budget alerts:', err);
    res.status(500).json({ error: 'Failed to fetch budget alerts' });
  }
});

// GET /api/alerts/credit-cards - Get detailed credit card utilization alerts
router.get('/credit-cards', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']), async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user || !req.workspaceId) return res.status(401).json({ error: 'Unauthorized' });

    const alerts = await evaluateCreditCardAlerts(req.user.id, req.workspaceId);
    res.json(alerts);
  } catch (err) {
    console.error('Error fetching credit card alerts:', err);
    res.status(500).json({ error: 'Failed to fetch credit card alerts' });
  }
});

// POST /api/alerts/dismiss - Dismiss/acknowledge an alert
router.post('/dismiss', requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']), async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { alertId } = req.body;

    if (!alertId) {
      return res.status(400).json({ error: 'alertId is required' });
    }

    // Optional notification record tracking
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        title: 'Alert Dismissed',
        message: `Alert ${alertId} acknowledged`,
        type: 'GENERAL',
        isRead: true,
      },
    });

    res.json({ success: true, message: 'Alert acknowledged' });
  } catch (err) {
    console.error('Error dismissing alert:', err);
    res.status(500).json({ error: 'Failed to dismiss alert' });
  }
});

export default router;
