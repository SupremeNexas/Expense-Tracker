import { Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { AuthenticatedRequest } from './auth';

export interface WorkspaceRequest extends AuthenticatedRequest {
  workspaceId?: string;
  workspaceRole?: string;
}

/**
 * Middleware to enforce Role-Based Access Control (RBAC) on workspace resources.
 * Supports transparent fallback to the user's default Personal Workspace if the
 * header 'x-workspace-id' is omitted, ensuring 100% backward compatibility.
 */
export function requireWorkspaceRole(allowedRoles: string[]) {
  return async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      let workspaceId = req.headers['x-workspace-id'] as string;

      // Fallback: Resolve user's default PERSONAL workspace if none specified
      if (!workspaceId) {
        const personalWsMember = await prisma.workspaceMember.findFirst({
          where: {
            userId: req.user.id,
            workspace: { type: 'PERSONAL' }
          }
        });

        if (!personalWsMember) {
          // If no personal workspace exists, create it dynamically to guarantee backward compatibility
          const defaultWs = await prisma.workspace.create({
            data: {
              name: 'Personal Workspace',
              type: 'PERSONAL',
              members: {
                create: {
                  userId: req.user.id,
                  role: 'OWNER'
                }
              }
            }
          });
          workspaceId = defaultWs.id;
        } else {
          workspaceId = personalWsMember.workspaceId;
        }
      }

      // Check user membership inside the workspace
      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: req.user.id
          }
        }
      });

      if (!member) {
        return res.status(403).json({ error: 'Forbidden: You are not a member of this workspace' });
      }

      // Check if role is allowed
      if (!allowedRoles.includes(member.role)) {
        return res.status(403).json({ error: 'Forbidden: Insufficient workspace permissions' });
      }

      // Attach workspace details to request
      req.workspaceId = workspaceId;
      req.workspaceRole = member.role;

      next();
    } catch (err) {
      console.error('RBAC validation error:', err);
      res.status(500).json({ error: 'Error during permissions check' });
    }
  };
}
