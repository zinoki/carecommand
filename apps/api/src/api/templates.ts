import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const templatesRouter = Router();

templatesRouter.use(requireAuth);
templatesRouter.use(requireRole(['ADMIN', 'STAFF']));

templatesRouter.get('/', async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const templates = await prisma.requirementTemplate.findMany({
      where: { tenantId },
      include: { items: { orderBy: { orderIndex: 'asc' } } },
    });
    res.json(templates);
  } catch (err) {
    next(err);
  }
});

templatesRouter.get('/:id', async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const template = await prisma.requirementTemplate.findFirst({
      where: { id: req.params.id, tenantId },
      include: { items: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!template) return res.status(404).json({ error: 'Not found' });
    res.json(template);
  } catch (err) {
    next(err);
  }
});

export { templatesRouter };
