/**
 * API for AxisCare-synced entities: clients, leads, applicants
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const router = Router();
router.use(requireAuth);

router.get('/clients', async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const clients = await prisma.client.findMany({
      where: {
        tenantId,
        OR: [
          { axisCareLifecycleStage: 'client' },
          { axisCareId: null, clientPipelineStage: 'Matched' },
        ],
      },
      orderBy: { lastName: 'asc' },
    });
    res.json(clients);
  } catch (err) {
    next(err);
  }
});

router.get('/clients/:id', async (req, res, next) => {
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

router.get('/leads', async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const leads = await prisma.client.findMany({
      where: {
        tenantId,
        OR: [
          { axisCareLifecycleStage: 'lead' },
          { axisCareId: null, clientPipelineStage: { not: null } },
        ],
      },
      orderBy: { lastName: 'asc' },
      include: { owner: true },
    });
    res.json(leads);
  } catch (err) {
    next(err);
  }
});

router.get('/leads/:id', async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const { id } = req.params;
    const lead = await prisma.client.findFirst({
      where: { id, tenantId },
      include: { owner: true },
    });
    if (!lead) return res.status(404).json({ error: 'Not found' });
    res.json(lead);
  } catch (err) {
    next(err);
  }
});

router.get('/applicants', async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const applicants = await prisma.caregiver.findMany({
      where: { tenantId, axisCareLifecycleStage: 'applicant' },
      orderBy: { lastName: 'asc' },
    });
    res.json(applicants);
  } catch (err) {
    next(err);
  }
});

router.get('/applicants/:id', async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const { id } = req.params;
    const applicant = await prisma.caregiver.findFirst({
      where: { id, tenantId, axisCareLifecycleStage: 'applicant' },
    });
    if (!applicant) return res.status(404).json({ error: 'Not found' });
    res.json({ ...applicant, rawData: applicant.axisCareRawData ?? {} });
  } catch (err) {
    next(err);
  }
});

export const axiscareEntitiesRouter = router;
