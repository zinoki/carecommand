import { Request } from 'express';
import { prisma } from '../lib/prisma.js';

export async function auditLog(
  tenantId: string,
  actorUserId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  req: Request,
  metadata?: Record<string, unknown>
) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId,
        action,
        entityType,
        entityId,
        metadataJson: (metadata || {}) as object,
        ipAddress: req.ip || req.socket?.remoteAddress,
        userAgent: req.get('user-agent') || undefined,
      },
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}
