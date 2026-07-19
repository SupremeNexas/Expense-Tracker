import { prisma } from '../../db/prisma';

/**
 * Ensures every user has a default Personal Workspace and migrates unassigned data to it.
 * This guarantees backward compatibility and prevents null reference scoping issues.
 */
export async function ensureDefaultWorkspaces(): Promise<void> {
  try {
    console.log('📦 Commencing Workspace Database Migration Sync...');

    const users = await prisma.user.findMany({
      include: {
        workspaceMembers: {
          include: {
            workspace: true
          }
        }
      }
    });

    for (const user of users) {
      // Look for an existing PERSONAL workspace
      let personalWsMember = user.workspaceMembers.find(
        m => m.workspace.type === 'PERSONAL' && m.role === 'OWNER'
      );

      let workspaceId = personalWsMember?.workspaceId;

      if (!workspaceId) {
        console.log(`Creating default Personal Workspace for user: ${user.email}`);

        // Create new Personal Workspace
        const ws = await prisma.workspace.create({
          data: {
            name: 'Personal Workspace',
            type: 'PERSONAL',
            members: {
              create: {
                userId: user.id,
                role: 'OWNER'
              }
            }
          }
        });
        workspaceId = ws.id;
      }

      // Migrate any unassigned user rows to this default workspace
      const scopingParams = { workspaceId };

      // 1. Wallets
      await prisma.wallet.updateMany({
        where: { userId: user.id, workspaceId: null },
        data: scopingParams
      });

      // 2. Transactions
      await prisma.transaction.updateMany({
        where: { userId: user.id, workspaceId: null },
        data: scopingParams
      });

      // 3. Budgets
      await prisma.budget.updateMany({
        where: { userId: user.id, workspaceId: null },
        data: scopingParams
      });

      // 4. Credit Cards
      await prisma.creditCard.updateMany({
        where: { userId: user.id, workspaceId: null },
        data: scopingParams
      });

      // 5. Savings Goals
      await prisma.goal.updateMany({
        where: { userId: user.id, workspaceId: null },
        data: scopingParams
      });

      // 6. Subscriptions
      await prisma.subscription.updateMany({
        where: { userId: user.id, workspaceId: null },
        data: scopingParams
      });

      // 7. Bills
      await prisma.bill.updateMany({
        where: { userId: user.id, workspaceId: null },
        data: scopingParams
      });

      // 8. Categories
      await prisma.category.updateMany({
        where: { userId: user.id, workspaceId: null },
        data: scopingParams
      });

      // 9. Recurring Transactions
      await prisma.recurringTransaction.updateMany({
        where: { userId: user.id, workspaceId: null },
        data: scopingParams
      });
    }

    console.log('✅ Workspace Scoping Migration complete. All rows aligned.');
  } catch (err) {
    console.error('❌ Error executing default workspaces check:', err);
  }
}
