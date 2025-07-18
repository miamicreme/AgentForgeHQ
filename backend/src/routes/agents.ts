import { Router } from 'express';

const router = Router();

const agentsList = [
  { id: 1, name: 'Example Agent' },
  { id: 2, name: 'Sample Agent' }
];

// Placeholder list endpoint for available agents
router.get('/list', (_req, res) => {
  res.json(agentsList);
});

export default router;
