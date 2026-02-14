import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const invitePublicRouter = Router();

invitePublicRouter.get('/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { tenant: true },
    });
    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    if (invite.expiresAt < new Date()) return res.status(410).json({ error: 'Invite expired' });
    res.json({ email: invite.email, role: invite.role, tenantName: invite.tenant.name });
  } catch (err) {
    next(err);
  }
});

export { invitePublicRouter };
