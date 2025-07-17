import express, { type Request, type Response } from 'express';
import cors from 'cors';
import agents from './routes/agents';
import chat from './routes/chat';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/agents', agents);
app.use('/', chat);
app.get('/healthz', (_req: Request, res: Response) => res.send('OK'));

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
