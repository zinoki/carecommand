import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const documentsRouter = Router();

documentsRouter.use(requireAuth);

documentsRouter.post('/upload', async (_req, res) => {
  res.status(501).json({ error: 'Document upload not yet implemented' });
});

documentsRouter.get('/:id/download', async (_req, res) => {
  res.status(501).json({ error: 'Document download not yet implemented' });
});

export { documentsRouter };
