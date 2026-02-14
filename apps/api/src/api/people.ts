import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const peopleRouter = Router();

peopleRouter.use(requireAuth);

peopleRouter.get('/', async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const persons = await prisma.person.findMany({
      where: { tenantId },
      include: { episodes: { orderBy: { episodeNumber: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(persons);
  } catch (err) {
    next(err);
  }
});

peopleRouter.get('/:id', async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const { id } = req.params;
    const person = await prisma.person.findFirst({
      where: { id, tenantId },
      include: {
        episodes: { orderBy: { episodeNumber: 'desc' }, include: { owner: true } },
        axisCareMapping: true,
      },
    });
    if (!person) return res.status(404).json({ error: 'Not found' });
    res.json(person);
  } catch (err) {
    next(err);
  }
});

peopleRouter.post('/', requireRole(['ADMIN', 'STAFF']), async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const { firstName, lastName, email, phone, isDriver } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : null;
    const normalizedPhone = phone ? phone.replace(/\D/g, '') : null;

    const person = await prisma.$transaction(async (tx) => {
      const p = await tx.person.create({
        data: {
          tenantId,
          firstName: firstName || 'Unknown',
          lastName: lastName || 'Unknown',
          email: normalizedEmail,
          phone: phone || null,
          normalizedEmail,
          normalizedPhone,
          isDriver: !!isDriver,
          eligibilityStatus: 'ELIGIBLE',
        },
      });
      await tx.employmentEpisode.create({
        data: {
          tenantId,
          personId: p.id,
          episodeNumber: 1,
          lifecycleStatus: 'CANDIDATE',
          recruitmentStage: 'Intake',
        },
      });
      return p;
    });

    const full = await prisma.person.findUnique({
      where: { id: person.id },
      include: { episodes: true },
    });
    res.status(201).json(full);
  } catch (err) {
    next(err);
  }
});

peopleRouter.patch('/:id', requireRole(['ADMIN', 'STAFF']), async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const { id } = req.params;
    const { firstName, lastName, email, phone, birthday, isDriver } = req.body;
    const existing = await prisma.person.findFirst({ where: { id, tenantId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const data: any = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (email !== undefined) data.email = email || null;
    if (email !== undefined) data.normalizedEmail = email ? email.toLowerCase().trim() : null;
    if (phone !== undefined) data.phone = phone || null;
    if (phone !== undefined) data.normalizedPhone = phone ? phone.replace(/\D/g, '') : null;
    if (birthday !== undefined) data.birthday = birthday ? new Date(birthday) : null;
    if (isDriver !== undefined) data.isDriver = !!isDriver;

    const person = await prisma.person.update({
      where: { id },
      data,
      include: { episodes: true },
    });
    res.json(person);
  } catch (err) {
    next(err);
  }
});

export { peopleRouter };
