import { Request, Response, NextFunction } from 'express';

export interface AuthPayload {
  sub: string;
  tenantId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = req.session;
  if (!session?.userId || !session?.tenantId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.auth = {
    sub: session!.userId!,
    tenantId: session!.tenantId!,
    role: session!.role || 'STAFF',
  };
  next();
}

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
