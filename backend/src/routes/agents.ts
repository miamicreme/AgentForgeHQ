import { Router } from 'express';

const router = Router();

interface Agent {
  id: number;
  name: string;
  template?: string;
  deepResearch?: boolean;
  messages?: any[];
}

const agents: Agent[] = [];
let nextAgentId = 1;

// Return a static list of templates
router.get('/templates', (_req, res) => {
  res.json([
    { name: 'basic', description: 'Basic template' },
    { name: 'advanced', description: 'Advanced template' }
  ]);
});

// Generate a simple agent spec from the provided data
router.post('/generate-ai-agent', (req, res) => {
  const { name, template, deepResearch } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }
  const agent: Agent = { id: nextAgentId++, name, template, deepResearch };
  agents.push(agent);
  res.json(agent);
});

// Save an agent spec
router.post('/save-agent', (req, res) => {
  const agent: Agent = { id: nextAgentId++, ...req.body };
  agents.push(agent);
  res.json({ success: true, id: agent.id });
});

// Create an agent from chat messages
router.post('/create-agent', (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages must be an array' });
  }
  const agent: Agent = { id: nextAgentId++, name: `Agent ${nextAgentId}`, messages };
  agents.push(agent);
  res.json({ success: true, id: agent.id });
});

// Placeholder for subscription checkout
router.post('/subscribe', (_req, res) => {
  res.json({ url: 'https://example.com/checkout' });
});

// Placeholder list endpoint for available agents
router.get('/list', (_req, res) => {
  res.json(agents);
});

export default router;
