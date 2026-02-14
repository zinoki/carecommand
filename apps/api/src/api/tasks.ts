import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const tasksRouter = Router();

tasksRouter.use(requireAuth);

tasksRouter.get('/', async (_req, res) => {
  res.json([]);
});

tasksRouter.post('/', async (_req, res) => {
  res.status(501).json({ error: 'Tasks API not yet implemented' });
});

export { tasksRouter };
