import { Router, type Request, type Response } from 'express';

const router = Router();

// Forward agent saves to the agent-api service
router.post('/save-agent', async (req: Request, res: Response) => {
  const apiUrl = process.env.AGENT_API_URL || 'http://localhost:4000';
  try {
    const resp = await fetch(`${apiUrl}/save-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) {
    console.error('Failed to save agent', err);
    res.status(500).json({ error: 'Failed to save agent' });
  }
});

export default router;
