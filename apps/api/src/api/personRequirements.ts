import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';

const personRequirementsRouter = Router();

personRequirementsRouter.use(requireAuth);
personRequirementsRouter.use(requireRole(['ADMIN', 'STAFF']));

personRequirementsRouter.get('/', async (_req, res) => {
  res.json([]);
});

personRequirementsRouter.patch('/:id', async (_req, res) => {
  res.status(501).json({ error: 'Person requirements API not yet implemented' });
});

export { personRequirementsRouter };
