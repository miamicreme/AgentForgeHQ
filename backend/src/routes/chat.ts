import { Router } from 'express';

const router = Router();

interface Message {
  id: number;
  content: string;
}

const messages: Message[] = [];
let nextId = 1;

// Returns all chat messages
router.get('/chat', (_req, res) => {
  res.json(messages);
});

// Adds a new chat message
router.post('/chat', (req, res) => {
  const { content } = req.body;
  const message: Message = { id: nextId++, content };
  messages.push(message);
  res.json(message);
});

export default router;
