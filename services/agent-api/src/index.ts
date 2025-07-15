import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors(), express.json());

app.get("/healthz", (_, res) => res.send("OK"));
app.get("/", (_, res) => res.json({ service: "AgentForgeHQ API" }));

interface Message {
  id: number;
  content: string;
}

const messages: Message[] = [];
let nextId = 1;

app.get("/chat", (_, res) => {
  res.json(messages);
});

app.post("/chat", (req, res) => {
  const message: Message = { id: nextId++, content: req.body.content };
  messages.push(message);
  res.json(message);
});

app.post("/agent", (req, res) => {
  // placeholder agent creation
  const agent = { id: Date.now(), name: req.body.name };
  res.json(agent);
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on ${port}`));
