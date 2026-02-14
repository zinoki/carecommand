import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const complianceRouter = Router();

complianceRouter.use(requireAuth);

complianceRouter.get('/', async (_req, res) => {
  res.json([]);
});

export { complianceRouter };
