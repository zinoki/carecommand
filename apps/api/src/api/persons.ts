/**
 * Compatibility layer: maps old /api/persons to new /api/people
 * Used by Recruiting page which fetches type=Candidate
 */
import { Router } from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { uploadFile } from '../lib/s3.js';

const personsRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

personsRouter.use(requireAuth);

personsRouter.get('/', async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const { type, status } = req.query;
    const where: any = { tenantId };
    const include: any = { episodes: { orderBy: { episodeNumber: 'desc' }, take: 1 } };

    if (type === 'Candidate') {
      const persons = await prisma.person.findMany({
        where: {
          tenantId,
          episodes: {
            some: { lifecycleStatus: 'CANDIDATE' },
          },
        },
        include: {
          ...include,
          episodes: { orderBy: { episodeNumber: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
      });
      return res.json(
        persons.map((p) => ({
          id: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          phone: p.phone,
          tenantId: p.tenantId,
          eligibilityStatus: p.eligibilityStatus,
          personRecruiting: {
            stage: (p.episodes[0] as any)?.recruitmentStage || 'Intake',
          },
        }))
      );
    }

    if (type === 'Caregiver') {
      const statuses = status ? (status as string).split(',') : ['ACTIVE'];
      const persons = await prisma.person.findMany({
        where: {
          tenantId,
          episodes: {
            some: { lifecycleStatus: { in: statuses } },
          },
        },
        include: { episodes: { orderBy: { episodeNumber: 'desc' }, take: 1 } },
        orderBy: { updatedAt: 'desc' },
      });
      return res.json(
        persons.map((p) => ({
          id: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          phone: p.phone,
          status: p.episodes[0]?.lifecycleStatus || 'ACTIVE',
        }))
      );
    }

    const persons = await prisma.person.findMany({
      where,
      include,
      orderBy: { updatedAt: 'desc' },
    });
    res.json(persons);
  } catch (err) {
    next(err);
  }
});

personsRouter.get('/:id', async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const { id } = req.params;
    const person = await prisma.person.findFirst({
      where: { id, tenantId },
      include: { episodes: { orderBy: { episodeNumber: 'desc' } } },
    });
    if (!person) return res.status(404).json({ error: 'Not found' });
    res.json({
      ...person,
      personRecruiting: person.episodes[0]
        ? { stage: person.episodes[0].recruitmentStage, interviewNotes: null }
        : null,
    });
  } catch (err) {
    next(err);
  }
});

personsRouter.post('/', upload.single('resume'), async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const body = req.body as Record<string, string>;
    const type = body.type;
    const firstName = body.firstName?.trim() || '';
    const lastName = body.lastName?.trim() || '';
    const email = body.email?.trim() || '';
    const phone = body.phone?.trim() || '';
    const file = req.file;

    if (type === 'Candidate') {
      if (!firstName) return res.status(400).json({ error: 'First name is required' });
      if (!lastName) return res.status(400).json({ error: 'Last name is required' });
      if (!email) return res.status(400).json({ error: 'Email is required' });
      if (!phone) return res.status(400).json({ error: 'Phone is required' });
      if (!file) return res.status(400).json({ error: 'Resume is required' });
    }
    const gender = body.gender?.trim() || null;
    const birthday = body.birthday ? new Date(body.birthday) : null;
    const city = body.city?.trim() || null;
    const hca = body.hca?.trim() || null;
    const expectedAvailabilityStart = body.expectedAvailabilityStart ? new Date(body.expectedAvailabilityStart) : null;
    const referrerName = body.referrerName?.trim() || null;
    const referrerRelationship = body.referrerRelationship?.trim() || null;
    const referrerEmail = body.referrerEmail?.trim() || null;
    const referenceNotes = body.referenceNotes?.trim() || null;

    const normalizedEmail = email ? email.toLowerCase().trim() : null;
    const normalizedPhone = phone ? phone.replace(/\D/g, '') : null;

    let resumeS3Key: string | null = null;
    if (file) {
      const ext = file.originalname.split('.').pop() || 'pdf';
      resumeS3Key = `tenants/${tenantId}/resumes/${nanoid()}.${ext}`;
      await uploadFile(resumeS3Key, file.buffer, file.mimetype, {
        tenantId,
        uploadedBy: req.auth!.sub,
      });
    }

    const person = await prisma.$transaction(async (tx) => {
      const p = await tx.person.create({
        data: {
          tenantId,
          firstName: firstName || 'Unknown',
          lastName: lastName || 'Unknown',
          email: normalizedEmail,
          phone: phone || null,
          birthday,
          gender,
          city,
          hca,
          normalizedEmail,
          normalizedPhone: normalizedPhone || null,
          isDriver: false,
          eligibilityStatus: 'ELIGIBLE',
        },
      });
      await tx.employmentEpisode.create({
        data: {
          tenantId,
          personId: p.id,
          episodeNumber: 1,
          lifecycleStatus: type === 'Candidate' ? 'CANDIDATE' : 'ONBOARDING',
          recruitmentStage: type === 'Candidate' ? 'Intake' : null,
          expectedAvailabilityStart,
          resumeS3Key,
          referrerName,
          referrerRelationship,
          referrerEmail,
          referenceNotes,
        },
      });
      return p;
    });

    const full = await prisma.person.findUnique({
      where: { id: person.id },
      include: { episodes: true },
    });
    res.status(201).json({
      ...full,
      personRecruiting: { stage: 'Intake' },
    });
  } catch (err) {
    next(err);
  }
});

export { personsRouter };
