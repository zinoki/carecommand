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
      where: { personId, tenantId, lifecycleStatus: 'CANDIDATE' },
    });
    if (!episode) return res.status(404).json({ error: 'Not found' });

    await prisma.employmentEpisode.update({
      where: { id: episode.id },
      data: { recruitmentStage: stage },
    });

    const person = await prisma.person.findUnique({
      where: { id: personId },
      include: { episodes: { orderBy: { episodeNumber: 'desc' }, take: 1 } },
    });
    res.json({
      ...person,
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

    const person = await prisma.person.findFirst({
      where: { id: personId, tenantId },
      include: { episodes: { where: { lifecycleStatus: 'CANDIDATE' }, orderBy: { episodeNumber: 'desc' }, take: 1 } },
    });
    if (!person) return res.status(404).json({ error: 'Not found' });

    const episode = person.episodes[0];
    if (!episode) return res.status(400).json({ error: 'No recruiting record' });

    const existingStrikes = await prisma.noShowEvent.count({
      where: { personId, tenantId },
    });
    const newCount = existingStrikes + 1;

    await prisma.noShowEvent.create({
      data: {
        tenantId,
        personId,
        occurredAt: new Date(),
        createdBy: req.auth!.sub,
      },
    });

    if (newCount >= 3) {
      await prisma.person.update({
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

    const full = await prisma.person.findUnique({
      where: { id: personId },
      include: { episodes: true },
    });
    res.json({
      ...full,
      personRecruiting: { stage: full?.episodes[0]?.recruitmentStage || 'Intake', noShowStrikes: newCount },
    });
  } catch (err) {
    next(err);
  }
});

export { recruitingRouter };
