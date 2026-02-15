/**
 * Clients API - unified Client model (leads + clients)
 * POST for adding leads, PATCH for stage/owner
 */
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const clientsRouter = Router();

clientsRouter.use(requireAuth);

clientsRouter.get('/', async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const { type } = req.query; // lead | client | all
    const where: Record<string, unknown> = { tenantId };

    if (type === 'lead') {
      where.OR = [
        { axisCareLifecycleStage: 'lead' },
        { axisCareId: null, clientPipelineStage: { not: null } },
      ];
    } else if (type === 'client') {
      where.OR = [
        { axisCareLifecycleStage: 'client' },
        { axisCareId: null, clientPipelineStage: 'Matched' },
      ];
    } else if (type === 'offboarded') {
      where.clientPipelineStage = { in: ['Offboarding', 'Offboarded'] };
    }

    const clients = await prisma.client.findMany({
      where: type === 'lead' || type === 'client' || type === 'offboarded' ? (where as object) : { tenantId },
      orderBy: { lastName: 'asc' },
      include: { owner: true },
    });
    res.json(clients);
  } catch (err) {
    next(err);
  }
});

clientsRouter.get('/:id', async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const { id } = req.params;
    const client = await prisma.client.findFirst({
      where: { id, tenantId },
      include: { owner: true },
    });
    if (!client) return res.status(404).json({ error: 'Not found' });
    res.json(client);
  } catch (err) {
    next(err);
  }
});

clientsRouter.post('/', requireRole(['ADMIN', 'STAFF']), async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const { firstName, lastName, email, phone, address, notes } = req.body as Record<string, string>;
    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ error: 'First and last name required' });
    }
    const client = await prisma.client.create({
      data: {
        tenantId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email?.trim() || undefined,
        phone: phone?.trim() || undefined,
        address: address?.trim() || undefined,
        clientPipelineStage: 'Lead',
        rawData: notes ? { notes } : {},
      },
    });
    res.status(201).json(client);
  } catch (err) {
    next(err);
  }
});

clientsRouter.patch('/:id/stage', requireRole(['ADMIN', 'STAFF']), async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const { id } = req.params;
    const { stage } = req.body as { stage?: string };
    if (!stage) return res.status(400).json({ error: 'Stage required' });
    const client = await prisma.client.findFirst({
      where: { id, tenantId },
    });
    if (!client) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.client.update({
      where: { id },
      data: { clientPipelineStage: stage },
      include: { owner: true },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

clientsRouter.patch('/:id/owner', requireRole(['ADMIN', 'STAFF']), async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const { id } = req.params;
    const { ownerUserId } = req.body as { ownerUserId?: string | null };
    const client = await prisma.client.findFirst({
      where: { id, tenantId },
    });
    if (!client) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.client.update({
      where: { id },
      data: { ownerUserId: ownerUserId || null },
      include: { owner: true },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export { clientsRouter };
