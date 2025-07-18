import { Router } from 'express';

const router = Router();

// Placeholder list endpoint for available agents
router.get('/list', (_req, res) => {
  res.json([
    { id: 1, name: 'Example Agent' }
  ]);
});

export default router;
