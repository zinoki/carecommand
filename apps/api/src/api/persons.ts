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
      const caregivers = await prisma.caregiver.findMany({
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
        caregivers.map((p) => ({
          id: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          phone: p.phone,
          tenantId: p.tenantId,
          eligibilityStatus: p.eligibilityStatus,
          personRecruiting: {
            stage: (p.episodes[0] as any)?.caregiverPipelineStage || 'Interview',
          },
        }))
      );
    }

    if (type === 'Applicant') {
      const caregivers = await prisma.caregiver.findMany({
        where: { tenantId, axisCareLifecycleStage: 'applicant' },
        orderBy: { updatedAt: 'desc' },
      });
      return res.json(caregivers);
    }

    if (type === 'Caregiver') {
      const statuses = status ? (status as string).split(',') : ['ACTIVE'];
      const caregivers = await prisma.caregiver.findMany({
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
        caregivers.map((p) => ({
          id: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          phone: p.phone,
          status: p.episodes[0]?.lifecycleStatus || 'ACTIVE',
        }))
      );
    }

    const caregivers = await prisma.caregiver.findMany({
      where,
      include,
      orderBy: { updatedAt: 'desc' },
    });
    res.json(caregivers);
  } catch (err) {
    next(err);
  }
});

personsRouter.get('/:id', async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const { id } = req.params;
    const caregiver = await prisma.caregiver.findFirst({
      where: { id, tenantId },
      include: {
        episodes: { orderBy: { episodeNumber: 'desc' } },
        axisCareMapping: true,
      },
    });
    if (!caregiver) return res.status(404).json({ error: 'Not found' });
    res.json({
      ...caregiver,
      personRecruiting: caregiver.episodes[0]
        ? { stage: caregiver.episodes[0].caregiverPipelineStage, interviewNotes: null }
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

    const caregiver = await prisma.$transaction(async (tx) => {
      const p = await tx.caregiver.create({
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
          caregiverId: p.id,
          episodeNumber: 1,
          lifecycleStatus: type === 'Candidate' ? 'CANDIDATE' : 'ONBOARDING',
          caregiverPipelineStage: type === 'Candidate' ? 'Interview' : null,
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

    const full = await prisma.caregiver.findUnique({
      where: { id: caregiver.id },
      include: { episodes: true },
    });
    res.status(201).json({
      ...full,
      personRecruiting: { stage: 'Interview' },
    });
  } catch (err) {
    next(err);
  }
});

export { personsRouter };
