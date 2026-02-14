import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const importRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

importRouter.use(requireAuth);
importRouter.use(requireRole(['ADMIN']));

function parseCSV(buffer: Buffer): string[][] {
  const text = buffer.toString('utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if ((c === ',' && !inQuotes) || c === '\t') {
        result.push(current.trim());
        current = '';
      } else {
        current += c;
      }
    }
    result.push(current.trim());
    return result;
  });
}

importRouter.post('/preview', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file' });

    const rows = parseCSV(file.buffer);
    const headers = rows[0] || [];
    const sample = rows.slice(1, 6);
    res.json({ headers, sample, rowCount: rows.length - 1 });
  } catch (err) {
    next(err);
  }
});

importRouter.post('/caregivers', upload.single('file'), async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file' });

    const rows = parseCSV(file.buffer);
    const headers = (rows[0] || []).map((h) => h.toLowerCase());
    const firstNameIdx = headers.findIndex((h) => /first|name|fname/.test(h));
    const lastNameIdx = headers.findIndex((h) => /last|lname|surname/.test(h));
    const emailIdx = headers.findIndex((h) => /email/.test(h));
    const phoneIdx = headers.findIndex((h) => /phone|tel/.test(h));

    let imported = 0;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const firstName = (firstNameIdx >= 0 ? row[firstNameIdx] : row[0]) || 'Unknown';
      const lastName = (lastNameIdx >= 0 ? row[lastNameIdx] : row[1]) || 'Unknown';
      const email = emailIdx >= 0 ? row[emailIdx] : undefined;
      const phone = phoneIdx >= 0 ? row[phoneIdx] : undefined;
      const normalizedEmail = email ? email.toLowerCase().trim() : null;

      await prisma.$transaction(async (tx) => {
        const p = await tx.person.create({
          data: {
            tenantId,
            firstName,
            lastName,
            email: normalizedEmail,
            phone: phone || null,
            normalizedEmail,
            normalizedPhone: phone ? phone.replace(/\D/g, '') : null,
            isDriver: false,
            eligibilityStatus: 'ELIGIBLE',
          },
        });
        await tx.employmentEpisode.create({
          data: {
            tenantId,
            personId: p.id,
            episodeNumber: 1,
            lifecycleStatus: 'ACTIVE',
            startDate: new Date(),
          },
        });
      });
      imported++;
    }

    res.json({ imported });
  } catch (err) {
    next(err);
  }
});

export { importRouter };
