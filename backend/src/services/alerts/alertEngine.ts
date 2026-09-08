import { prisma } from '../../db/prisma';
import { Prisma } from '@prisma/client';

export interface FinancialAlert {
  id: string;
  type: 'BUDGET_ALERT' | 'CREDIT_CARD_ALERT' | 'SPENDING_LIMIT_ALERT';
  severity: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  categoryId?: string;
  categoryName?: string;
  cardId?: string;
  cardName?: string;
  walletId?: string;
  walletName?: string;
  spent: number;
  limit: number;
  percentage: number;
  createdAt: string;
  actionUrl?: string;
}

export interface SpendingLimitProgress {
  id: string;
  name: string;
  type: 'CATEGORY' | 'WALLET' | 'OVERALL';
  categoryId?: string;
  walletId?: string;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'normal' | 'warning' | 'exceeded';
}

/**
 * Calculates budget threshold alerts for a user/workspace in a given period.
 * Thresholds: 50%, 75%, 80%, 90%, 100% (exceeded).
 */
export async function evaluateBudgetAlerts(
  userId: string,
  workspaceId?: string,
  month?: number,
  year?: number
): Promise<FinancialAlert[]> {
  const now = new Date();
  const filterMonth = month || now.getMonth() + 1;
  const filterYear = year || now.getFullYear();

  const start = new Date(filterYear, filterMonth - 1, 1);
  const end = new Date(filterYear, filterMonth, 0, 23, 59, 59);

  const budgetWhere: Prisma.BudgetWhereInput = workspaceId
    ? { workspaceId, startDate: { gte: start }, endDate: { lte: end } }
    : { userId, startDate: { gte: start }, endDate: { lte: end } };

  const budgets = await prisma.budget.findMany({
    where: budgetWhere,
    include: { category: true },
  });

  const alerts: FinancialAlert[] = [];

  for (const b of budgets) {
    const limit = Number(b.amount);
    if (limit <= 0) continue; // Skip zero/invalid budget amounts safely

    const txnWhere: Prisma.TransactionWhereInput = workspaceId
      ? {
          workspaceId,
          categoryId: b.categoryId,
          type: 'EXPENSE',
          date: { gte: b.startDate, lte: b.endDate },
        }
      : {
          userId,
          categoryId: b.categoryId,
          type: 'EXPENSE',
          date: { gte: b.startDate, lte: b.endDate },
        };

    const spentSum = await prisma.transaction.aggregate({
      where: txnWhere,
      _sum: { amount: true },
    });

    const spent = Number(spentSum._sum.amount || 0);
    const percentage = Math.round((spent / limit) * 100);

    let severity: 'info' | 'warning' | 'danger' | null = null;
    let title = '';
    let message = '';

    if (percentage >= 100) {
      severity = 'danger';
      title = `Budget Exceeded: ${b.category.name}`;
      message = `You have spent ${percentage}% (${spent.toFixed(2)} of ${limit.toFixed(2)}) of your ${b.category.name} budget.`;
    } else if (percentage >= 90) {
      severity = 'danger';
      title = `Critical Budget Alert: ${b.category.name}`;
      message = `You have used ${percentage}% (${spent.toFixed(2)} of ${limit.toFixed(2)}) of your ${b.category.name} budget.`;
    } else if (percentage >= 80) {
      severity = 'warning';
      title = `High Budget Usage: ${b.category.name}`;
      message = `You have reached ${percentage}% of your ${b.category.name} budget limit.`;
    } else if (percentage >= 75) {
      severity = 'warning';
      title = `Budget Warning: ${b.category.name}`;
      message = `You have reached ${percentage}% of your ${b.category.name} budget.`;
    } else if (percentage >= 50) {
      severity = 'info';
      title = `Budget Update: ${b.category.name}`;
      message = `You have used half (${percentage}%) of your ${b.category.name} budget.`;
    }

    if (severity) {
      alerts.push({
        id: `budget-alert-${b.id}-${filterYear}-${filterMonth}`,
        type: 'BUDGET_ALERT',
        severity,
        title,
        message,
        categoryId: b.categoryId,
        categoryName: b.category.name,
        spent,
        limit,
        percentage,
        createdAt: now.toISOString(),
        actionUrl: '/budgets',
      });
    }
  }

  return alerts;
}

/**
 * Calculates credit card utilization alerts for a user/workspace.
 * Thresholds: >30% (warning), >70% (danger), or payment due in <= 5 days.
 */
export async function evaluateCreditCardAlerts(
  userId: string,
  workspaceId?: string
): Promise<FinancialAlert[]> {
  const cardWhere: Prisma.CreditCardWhereInput = workspaceId
    ? { workspaceId }
    : { userId };

  const cards = await prisma.creditCard.findMany({
    where: cardWhere,
  });

  const alerts: FinancialAlert[] = [];
  const now = new Date();

  for (const c of cards) {
    const limit = Number(c.limitAmount);
    const totalDue = Number(c.totalDue);
    const utilization = limit > 0 ? (totalDue / limit) * 100 : 0;
    const roundedUtil = Math.round(utilization);

    const dueDays = Math.ceil(
      (new Date(c.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // 1. High Utilization Alert (>70%)
    if (roundedUtil >= 70) {
      alerts.push({
        id: `card-util-high-${c.id}`,
        type: 'CREDIT_CARD_ALERT',
        severity: 'danger',
        title: `High Credit Card Utilization: ${c.name}`,
        message: `Card utilization is at ${roundedUtil}% (${totalDue.toFixed(2)} / ${limit.toFixed(2)}). Keep usage below 30% to protect credit score.`,
        cardId: c.id,
        cardName: c.name,
        spent: totalDue,
        limit,
        percentage: roundedUtil,
        createdAt: now.toISOString(),
        actionUrl: '/credit-cards',
      });
    } else if (roundedUtil >= 30) {
      alerts.push({
        id: `card-util-mod-${c.id}`,
        type: 'CREDIT_CARD_ALERT',
        severity: 'warning',
        title: `Moderate Credit Card Utilization: ${c.name}`,
        message: `Card utilization is at ${roundedUtil}% (${totalDue.toFixed(2)} / ${limit.toFixed(2)}).`,
        cardId: c.id,
        cardName: c.name,
        spent: totalDue,
        limit,
        percentage: roundedUtil,
        createdAt: now.toISOString(),
        actionUrl: '/credit-cards',
      });
    }

    // 2. Upcoming Due Date Alert (due within 5 days)
    if (dueDays >= 0 && dueDays <= 5) {
      alerts.push({
        id: `card-due-${c.id}`,
        type: 'CREDIT_CARD_ALERT',
        severity: 'danger',
        title: `Credit Card Payment Due Soon: ${c.name}`,
        message: `Payment of ${totalDue.toFixed(2)} is due in ${dueDays} day(s). Pay on time to avoid fees.`,
        cardId: c.id,
        cardName: c.name,
        spent: totalDue,
        limit,
        percentage: roundedUtil,
        createdAt: now.toISOString(),
        actionUrl: '/credit-cards',
      });
    }
  }

  return alerts;
}

/**
 * Calculates spending limits and progress across categories, wallets, and overall monthly budget.
 */
export async function evaluateSpendingLimits(
  userId: string,
  workspaceId?: string,
  month?: number,
  year?: number
): Promise<{ limits: SpendingLimitProgress[]; alerts: FinancialAlert[] }> {
  const now = new Date();
  const filterMonth = month || now.getMonth() + 1;
  const filterYear = year || now.getFullYear();

  const start = new Date(filterYear, filterMonth - 1, 1);
  const end = new Date(filterYear, filterMonth, 0, 23, 59, 59);

  const budgetWhere: Prisma.BudgetWhereInput = workspaceId
    ? { workspaceId, startDate: { gte: start }, endDate: { lte: end } }
    : { userId, startDate: { gte: start }, endDate: { lte: end } };

  const budgets = await prisma.budget.findMany({
    where: budgetWhere,
    include: { category: true },
  });

  const limits: SpendingLimitProgress[] = [];
  const alerts: FinancialAlert[] = [];

  for (const b of budgets) {
    const limit = Number(b.amount);
    if (limit <= 0) continue;

    const txnWhere: Prisma.TransactionWhereInput = workspaceId
      ? {
          workspaceId,
          categoryId: b.categoryId,
          type: 'EXPENSE',
          date: { gte: b.startDate, lte: b.endDate },
        }
      : {
          userId,
          categoryId: b.categoryId,
          type: 'EXPENSE',
          date: { gte: b.startDate, lte: b.endDate },
        };

    const spentSum = await prisma.transaction.aggregate({
      where: txnWhere,
      _sum: { amount: true },
    });

    const spent = Number(spentSum._sum.amount || 0);
    const remaining = Math.max(0, limit - spent);
    const percentage = Math.round((spent / limit) * 100);

    let status: 'normal' | 'warning' | 'exceeded' = 'normal';
    if (percentage >= 100) {
      status = 'exceeded';
    } else if (percentage >= 80) {
      status = 'warning';
    }

    limits.push({
      id: `limit-cat-${b.id}`,
      name: b.category.name,
      type: 'CATEGORY',
      categoryId: b.categoryId,
      limit,
      spent,
      remaining,
      percentage,
      status,
    });

    if (status === 'exceeded' || status === 'warning') {
      alerts.push({
        id: `spending-limit-alert-${b.id}`,
        type: 'SPENDING_LIMIT_ALERT',
        severity: status === 'exceeded' ? 'danger' : 'warning',
        title: `Spending Limit ${status === 'exceeded' ? 'Exceeded' : 'Warning'}: ${b.category.name}`,
        message: `Spent ${spent.toFixed(2)} of ${limit.toFixed(2)} limit (${percentage}%).`,
        categoryId: b.categoryId,
        categoryName: b.category.name,
        spent,
        limit,
        percentage,
        createdAt: now.toISOString(),
        actionUrl: '/budgets',
      });
    }
  }

  return { limits, alerts };
}

/**
 * Combines all financial alert evaluation into an aggregated server-side report.
 * Guaranteed zero transaction mutations.
 */
export async function evaluateAllFinancialAlerts(
  userId: string,
  workspaceId?: string
): Promise<{ alerts: FinancialAlert[]; summary: { totalAlerts: number; highSeverityCount: number } }> {
  const budgetAlerts = await evaluateBudgetAlerts(userId, workspaceId);
  const creditAlerts = await evaluateCreditCardAlerts(userId, workspaceId);
  const { alerts: spendingLimitAlerts } = await evaluateSpendingLimits(userId, workspaceId);

  // Combine and deduplicate alerts by unique alert ID
  const map = new Map<string, FinancialAlert>();
  [...budgetAlerts, ...creditAlerts, ...spendingLimitAlerts].forEach((a) => {
    map.set(a.id, a);
  });

  const allAlerts = Array.from(map.values()).sort((a, b) => {
    const severityOrder = { danger: 3, warning: 2, info: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });

  const highSeverityCount = allAlerts.filter((a) => a.severity === 'danger').length;

  return {
    alerts: allAlerts,
    summary: {
      totalAlerts: allAlerts.length,
      highSeverityCount,
    },
  };
}
