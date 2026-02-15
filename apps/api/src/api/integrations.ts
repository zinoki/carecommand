import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { axisCareConnectionSchema } from '@carecommand/shared';
import { prisma } from '../lib/prisma.js';
import { runAxisCareSync } from '../lib/axiscare-sync.js';
import {
  getAxisCareBaseUrl,
  listCaregivers,
} from '../lib/axiscare.js';
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
      const { siteNumber, apiToken } = req.body;

      const existing = await prisma.axisCareConnection.findUnique({
        where: { tenantId },
      });
      if (!existing && !apiToken) {
        return res.status(400).json({ error: 'API token is required when creating connection' });
      }

      const updateData: { siteNumber: string; apiTokenEncrypted?: string } = { siteNumber };
      if (apiToken && apiToken.trim()) {
        updateData.apiTokenEncrypted = encrypt(apiToken);
      }

      const conn = await prisma.axisCareConnection.upsert({
        where: { tenantId },
        create: {
          tenantId,
          siteNumber,
          apiTokenEncrypted: encrypt(apiToken!),
        },
        update: updateData,
      });
      res.json({
        id: conn.id,
        siteNumber: conn.siteNumber,
        lastSyncAt: conn.lastSyncAt,
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
    const baseUrl = getAxisCareBaseUrl(conn.siteNumber);
    const data = await listCaregivers(baseUrl, token);
    // Just verify we got a response (array)
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'AxisCare API returned unexpected format' });
    }
    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AxisCare API error';
    return res.status(400).json({ error: message });
  }
});

integrationsRouter.post('/axiscare/sync', async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const conn = await prisma.axisCareConnection.findUnique({
      where: { tenantId },
    });
    if (!conn) return res.status(400).json({ error: 'AxisCare not configured' });

    const token = decrypt(conn.apiTokenEncrypted);
    const stats = await runAxisCareSync(
      prisma,
      tenantId,
      conn.siteNumber,
      token
    );

    await prisma.axisCareConnection.update({
      where: { tenantId },
      data: { lastSyncAt: new Date(), updatedAt: new Date() },
    });

    res.json({
      success: true,
      applicants: stats.applicants,
      caregivers: stats.caregivers,
      clients: stats.clients,
      leads: stats.leads,
    });
  } catch (err) {
    next(err);
  }
});

export { integrationsRouter };
