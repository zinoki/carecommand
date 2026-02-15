import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const recruitingRouter = Router();

recruitingRouter.use(requireAuth);
recruitingRouter.use(requireRole(['ADMIN', 'STAFF']));

recruitingRouter.patch('/:personId/stage', async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const { personId } = req.params;
    const { stage } = req.body;
    if (!stage) return res.status(400).json({ error: 'Stage required' });

    const episode = await prisma.employmentEpisode.findFirst({
      where: { caregiverId: personId, tenantId, lifecycleStatus: 'CANDIDATE' },
    });
    if (!episode) return res.status(404).json({ error: 'Not found' });

    await prisma.employmentEpisode.update({
      where: { id: episode.id },
      data: { caregiverPipelineStage: stage },
    });

    const caregiver = await prisma.caregiver.findUnique({
      where: { id: personId },
      include: { episodes: { orderBy: { episodeNumber: 'desc' }, take: 1 } },
    });
    res.json({
      ...caregiver,
      personRecruiting: { stage },
    });
  } catch (err) {
    next(err);
  }
});

recruitingRouter.patch('/:personId/no-show', async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const { personId } = req.params;

    const caregiver = await prisma.caregiver.findFirst({
      where: { id: personId, tenantId },
      include: { episodes: { where: { lifecycleStatus: 'CANDIDATE' }, orderBy: { episodeNumber: 'desc' }, take: 1 } },
    });
    if (!caregiver) return res.status(404).json({ error: 'Not found' });

    const episode = caregiver.episodes[0];
    if (!episode) return res.status(400).json({ error: 'No recruiting record' });

    const existingStrikes = await prisma.noShowEvent.count({
      where: { caregiverId: personId, tenantId },
    });
    const newCount = existingStrikes + 1;

    await prisma.noShowEvent.create({
      data: {
        tenantId,
        caregiverId: personId,
        occurredAt: new Date(),
        createdBy: req.auth!.sub,
      },
    });

    if (newCount >= 3) {
      await prisma.caregiver.update({
        where: { id: personId },
        data: {
          eligibilityStatus: 'INELIGIBLE',
          eligibilityReasonCategory: 'NO_SHOW_STRIKES',
          eligibilityReasonNotes: 'Auto-ineligible: 3 no-show strikes',
          eligibilitySetByUserId: req.auth!.sub,
          eligibilitySetAt: new Date(),
        },
      });
    }

    const full = await prisma.caregiver.findUnique({
      where: { id: personId },
      include: { episodes: true },
    });
    res.json({
      ...full,
      personRecruiting: { stage: full?.episodes[0]?.caregiverPipelineStage || 'Interview', noShowStrikes: newCount },
    });
  } catch (err) {
    next(err);
  }
});

export { recruitingRouter };
