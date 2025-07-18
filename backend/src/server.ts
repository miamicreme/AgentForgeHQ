import express from 'express';
import cors from 'cors';
import agents from './routes/agents';
import chat from './routes/chat';

const app = express();
app.use(cors());
app.use(express.json());

// Mount agent routes at the root so paths match the client requests
app.use('/', agents);
app.use('/', chat);
app.get('/', (_req, res) => res.json({ service: 'AgentForgeHQ backend' }));
app.get('/healthz', (_req, res) => res.send('OK'));

const port = process.env.PORT || 4000;
if (process.env.VITEST !== 'true') {
  app.listen(port, () => {
    console.log(`Server listening on ${port}`);
  });
}

export default app;
