import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { inviteUserSchema } from '@carecommand/shared';
import { prisma } from '../lib/prisma.js';
import { nanoid } from 'nanoid';

const invitesRouter = Router();

invitesRouter.use(requireAuth);
invitesRouter.use(requireRole(['ADMIN', 'STAFF']));

invitesRouter.post('/', validateBody(inviteUserSchema), async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const { email, role } = req.body;

    const existing = await prisma.user.findFirst({
      where: { tenantId, email: email.toLowerCase() },
    });
    if (existing) {
      return res.status(409).json({ error: 'User already in organization' });
    }

    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await prisma.invite.create({
      data: {
        email,
        tenantId,
        role,
        token,
        expiresAt,
        invitedBy: req.auth!.sub,
      },
    });

    const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/invite/${token}`;
    res.status(201).json({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      inviteLink,
    });
  } catch (err) {
    next(err);
  }
});

invitesRouter.get('/', async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const invites = await prisma.invite.findMany({
      where: { tenantId, expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: 'asc' },
    });
    res.json(invites);
  } catch (err) {
    next(err);
  }
});

export { invitesRouter };
