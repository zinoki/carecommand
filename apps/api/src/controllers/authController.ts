import { Request, Response, NextFunction } from 'express';
import * as argon2 from 'argon2';
import { prisma } from '../lib/prisma.js';

const LOCKOUT_THRESHOLD = 10;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export const authController = {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, agencyName } = req.body;
      const existing = await prisma.user.findFirst({
        where: { email: email.toLowerCase() },
      });
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
      const freePlan = await prisma.plan.findFirst({ where: { name: 'Free' } });
      if (!freePlan) {
        return res.status(500).json({ error: 'Free plan not configured' });
      }

      const [firstName, ...lastParts] = (name || 'User').trim().split(/\s+/);
      const lastName = lastParts.join(' ') || firstName;

      const result = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: { name: agencyName || 'My Agency' },
        });
        const user = await tx.user.create({
          data: {
            tenantId: tenant.id,
            email: email.toLowerCase(),
            passwordHash,
            role: 'ADMIN',
            firstName,
            lastName,
          },
        });
        await tx.tenantBilling.create({
          data: { tenantId: tenant.id, planId: freePlan.id, status: 'FREE' },
        });
        return { user, tenant };
      });

      req.session!.userId = result.user.id;
      req.session!.tenantId = result.tenant.id;
      req.session!.role = 'ADMIN';

      res.status(201).json({
        user: {
          id: result.user.id,
          email: result.user.email,
          name: `${result.user.firstName} ${result.user.lastName}`,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
        },
        tenant: { id: result.tenant.id, name: result.tenant.name },
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findFirst({
        where: { email: (email || '').toLowerCase(), isActive: true },
        include: { tenant: true },
      });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (user.lockedUntil && user.lockedUntil > new Date()) {
        return res.status(423).json({
          error: 'Account locked. Try again later.',
          lockedUntil: user.lockedUntil.toISOString(),
        });
      }

      const valid = await argon2.verify(user.passwordHash, password);
      if (!valid) {
        const attempts = user.failedLoginAttempts + 1;
        const updates: any = { failedLoginAttempts: attempts };
        if (attempts >= LOCKOUT_THRESHOLD) {
          updates.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        }
        await prisma.user.update({
          where: { id: user.id },
          data: updates,
        });
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
      });

      req.session!.userId = user.id;
      req.session!.tenantId = user.tenantId;
      req.session!.role = user.role;

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        tenant: { id: user.tenant.id, name: user.tenant.name },
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    return new Promise<void>((resolve, reject) => {
      req.session?.destroy((err: Error) => {
        if (err) return reject(err);
        res.json({ ok: true });
        resolve();
      });
    });
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const session = (req as any).session;
      if (!session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { tenant: true },
      });
      if (!user || !user.isActive) {
        (req as any).session = null;
        return res.status(401).json({ error: 'Session expired' });
      }
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        tenant: { id: user.tenant.id, name: user.tenant.name },
      });
    } catch (err) {
      next(err);
    }
  },
};
