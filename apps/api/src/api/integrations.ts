import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { axisCareConnectionSchema } from '@carecommand/shared';
import { prisma } from '../lib/prisma.js';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'dev-key-32-bytes-long!!!!';
const ALG = 'aes-256-gcm';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32));
  const cipher = crypto.createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, enc]).toString('base64');
}

function decrypt(enc: string): string {
  const buf = Buffer.from(enc, 'base64');
  const iv = buf.subarray(0, 16);
  const authTag = buf.subarray(16, 32);
  const data = buf.subarray(32);
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32));
  const decipher = crypto.createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(data) + decipher.final('utf8');
}

const integrationsRouter = Router();

integrationsRouter.use(requireAuth);
integrationsRouter.use(requireRole(['ADMIN']));

integrationsRouter.get('/axiscare', async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const conn = await prisma.axisCareConnection.findUnique({
      where: { tenantId },
    });
    if (!conn) return res.json(null);
    res.json({
      id: conn.id,
      siteNumber: conn.siteNumber,
      enabled: conn.enabled,
      syncMode: conn.syncMode,
      syncFrequencyMinutes: conn.syncFrequencyMinutes,
      lastSyncAt: conn.lastSyncAt,
    });
  } catch (err) {
    next(err);
  }
});

integrationsRouter.put(
  '/axiscare',
  validateBody(axisCareConnectionSchema),
  async (req, res, next) => {
    try {
      const { tenantId } = req.auth!;
      const { siteNumber, apiToken, syncEnabled, syncFrequencyMinutes } = req.body;

      const conn = await prisma.axisCareConnection.upsert({
        where: { tenantId },
        create: {
          tenantId,
          siteNumber,
          apiTokenEncrypted: encrypt(apiToken),
          enabled: syncEnabled ?? false,
          syncMode: 'READ_ONLY',
          syncFrequencyMinutes: syncFrequencyMinutes ?? 60,
        },
        update: {
          siteNumber,
          apiTokenEncrypted: encrypt(apiToken),
          enabled: syncEnabled ?? undefined,
          syncFrequencyMinutes: syncFrequencyMinutes ?? undefined,
        },
      });
      res.json({
        id: conn.id,
        siteNumber: conn.siteNumber,
        enabled: conn.enabled,
        syncMode: conn.syncMode,
        syncFrequencyMinutes: conn.syncFrequencyMinutes,
      });
    } catch (err) {
      next(err);
    }
  }
);

integrationsRouter.post('/axiscare/test', async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const conn = await prisma.axisCareConnection.findUnique({
      where: { tenantId },
    });
    if (!conn) return res.status(400).json({ error: 'AxisCare not configured' });

    const token = decrypt(conn.apiTokenEncrypted);
    const baseUrl = process.env.AXISCARE_BASE_URL || 'https://api.axiscare.com';
    const res2 = await fetch(`${baseUrl}/v1/caregivers?limit=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Site-Number': conn.siteNumber,
      },
    });
    if (!res2.ok) {
      const err = await res2.text();
      return res.status(400).json({ error: `AxisCare API error: ${err}` });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export { integrationsRouter };
