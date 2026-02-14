import { Router } from 'express';
import * as argon2 from 'argon2';
import { prisma } from '../lib/prisma.js';

const inviteAcceptRouter = Router();

inviteAcceptRouter.post('/', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });
    if (!password || password.length < 8) return res.status(400).json({ error: 'Password required (min 8 characters)' });

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { tenant: true },
    });
    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    if (invite.expiresAt < new Date()) return res.status(410).json({ error: 'Invite expired' });

    const existing = await prisma.user.findFirst({
      where: { tenantId: invite.tenantId, email: invite.email.toLowerCase() },
    });
    if (existing) return res.status(409).json({ error: 'Already a member' });

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const [firstName, ...lastParts] = invite.email.split('@')[0].split(/[._-]/);
    const lastName = lastParts.join(' ') || firstName;

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          tenantId: invite.tenantId,
          email: invite.email.toLowerCase(),
          passwordHash,
          role: invite.role,
          firstName: firstName || 'User',
          lastName: lastName || 'Name',
        },
      });
      await tx.invite.delete({ where: { id: invite.id } });
    });

    res.json({
      tenant: { id: invite.tenant.id, name: invite.tenant.name },
      message: 'Account created. You can now log in.',
    });
  } catch (err) {
    next(err);
  }
});

export { inviteAcceptRouter };
