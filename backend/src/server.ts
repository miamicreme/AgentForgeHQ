import express from 'express';
import cors from 'cors';
import agents from './routes/agents';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/agents', agents);
app.get('/healthz', (_req, res) => res.send('OK'));

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
