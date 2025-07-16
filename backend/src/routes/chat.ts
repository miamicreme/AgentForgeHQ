import { Router } from 'express';

interface Message {
  id: number;
  content: string;
}

const router = Router();

const messages: Message[] = [];
let nextId = 1;

router.get('/chat', (_req, res) => {
  res.json(messages);
});

router.post('/chat', (req, res) => {
  const { content } = req.body;
  if (typeof content !== 'string') {
    return res.status(400).json({ error: 'Invalid message' });
  }
  const message = { id: nextId++, content };
  messages.push(message);
  res.json(message);
});

router.post('/create-agent', (req, res) => {
  // Placeholder for agent creation using chat messages
  res.json({ message: 'Agent created', input: req.body });
});

export default router;
