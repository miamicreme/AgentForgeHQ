import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { getSupabaseClient } from "./supabaseClient";
dotenv.config();

const app = express();
app.use(cors(), express.json());

app.get("/healthz", (_, res) => res.send("OK"));
app.get("/", (_, res) => res.json({ service: "AgentForgeHQ API" }));

interface Message {
  id: number;
  content: string;
}

const messages: Me
app.post("/save-agent", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : undefined;
  const supabase = getSupabaseClient(token);
  const { data, error } = await supabase
    .from("user_agents")
    .insert(req.body)
    .select()
    .single();
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.json(data);
app.post("/validate-agent", (req, res) => {
  const result = agentSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.errors });
  }
  res.json({ valid: true });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on ${port}`));
