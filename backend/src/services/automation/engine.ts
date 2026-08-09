import { prisma } from '../../db/prisma';

export interface AutomationRule {
  triggerType: 'TRANSACTION_CREATED' | 'BUDGET_OVERRUN' | 'GOAL_COMPLETED';
  conditions: {
    category?: string;
    amountGreaterThan?: number;
    titleContains?: string;
    type?: 'EXPENSE' | 'INCOME';
  };
  actions: {
    type: 'TAG_TRANSACTION' | 'SEND_NOTIFICATION' | 'ALLOCATE_SAVINGS' | 'CREATE_RECURRING';
    value?: string;
    percentage?: number;
    goalId?: string;
  }[];
}

/**
 * Evaluates and triggers automations configured for a workspace
 */
export async function triggerAutomations(
  workspaceId: string,
  triggerType: string,
  payload: any
): Promise<void> {
  try {
    const automations = await prisma.automation.findMany({
      where: { workspaceId, isActive: true }
    });

    for (const auto of automations) {
      if (auto.triggerType !== triggerType) continue;

      const rule = {
        conditions: auto.conditions as any,
        actions: auto.actions as any
      };

      // 1. Evaluate conditions
      let matched = true;

      if (triggerType === 'TRANSACTION_CREATED') {
        const t = payload;
        const cond = rule.conditions;

        if (cond.category) {
          const category = await prisma.category.findUnique({ where: { id: t.categoryId } });
          if (!category || !category.name.toLowerCase().includes(cond.category.toLowerCase())) {
            matched = false;
          }
        }

        if (cond.amountGreaterThan && Number(t.amount) <= cond.amountGreaterThan) {
          matched = false;
        }

        if (cond.titleContains && !t.title.toLowerCase().includes(cond.titleContains.toLowerCase())) {
          matched = false;
        }

        if (cond.type && t.type !== cond.type) {
          matched = false;
        }
      }

      if (!matched) continue;

      console.log(`🤖 Executing automation rule: "${auto.name}"`);

      // 2. Run actions
      for (const action of rule.actions) {
        if (action.type === 'TAG_TRANSACTION' && triggerType === 'TRANSACTION_CREATED') {
          const newTags = Array.from(new Set([...payload.tags, action.value || 'automated']));
          await prisma.transaction.update({
            where: { id: payload.id },
            data: { tags: newTags }
          });
        }

        if (action.type === 'SEND_NOTIFICATION') {
          // Notify all workspace members
          const members = await prisma.workspaceMember.findMany({
            where: { workspaceId }
          });
          
          await Promise.all(
            members.map(m =>
              prisma.notification.create({
                data: {
                  userId: m.userId,
                  title: `Automation: ${auto.name}`,
                  message: action.value || `Automation rule executed: ${auto.name}`,
                  type: 'GENERAL'
                }
              })
            )
          );
        }

        if (action.type === 'ALLOCATE_SAVINGS' && triggerType === 'TRANSACTION_CREATED' && payload.type === 'INCOME') {
          // Automatically contribute to savings goals on salary/income
          const amount = Number(payload.amount);
          const percent = action.percentage || 10;
          const contributeVal = (amount * percent) / 100;
          
          let goalId = action.goalId;
          if (!goalId) {
            const allGoals = await prisma.goal.findMany({
              where: { workspaceId }
            });
            const firstGoal = allGoals.find(g => Number(g.currentAmount) < Number(g.targetAmount));
            goalId = firstGoal?.id;
          }

          if (goalId && contributeVal > 0) {
            await prisma.goalContribution.create({
              data: {
                goalId,
                amount: contributeVal,
                notes: `Auto-allocated ${percent}% from income: ${payload.title}`
              }
            });

            await prisma.goal.update({
              where: { id: goalId },
              data: { currentAmount: { increment: contributeVal } }
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error executing automation engine:', err);
  }
}
