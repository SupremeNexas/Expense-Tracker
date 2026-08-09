import { prisma } from '../../db/prisma';

/**
 * Creates an immutable audit log record for workspace/user operations
 */
export async function logAction(
  userId: string,
  workspaceId: string | undefined,
  action: string,
  resource: string,
  resourceId: string | null = null,
  previousValues: any = null,
  newValues: any = null,
  tx?: any
): Promise<void> {
  try {
    const db = tx || prisma;
    await db.auditLog.create({
      data: {
        userId,
        workspaceId,
        action,
        resource,
        resourceId,
        previousValues: previousValues ? JSON.parse(JSON.stringify(previousValues)) : null,
        newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null
      }
    });
  } catch (err) {
    console.error('Failed to create audit log entry:', err);
  }
}
