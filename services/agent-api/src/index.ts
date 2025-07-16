import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";


import Stripe from "stripe";
import { agentSchema } from "../../../validation/agentSchema";
import { getSupabaseClient } from "./supabaseClient";
import openai from "./openai";


dotenv.config();

const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY as string);


const app = express();
app.use(cors(), express.json());

const templatesDir = path.join(__dirname, "../templates");
const systemPrompt = fs.readFileSync(
  path.join(__dirname, "../manual/system-prompt.txt"),
  "utf8"
);
const deepSystemPrompt = fs.readFileSync(
  path.join(__dirname, "../manual/deep-system-prompt.txt"),
  "utf8"
);

app.get("/templates", (_req, res) => {
  try {
    const files = fs.readdirSync(templatesDir).filter((f) => f.endsWith(".json"));
    const templates = files.map((file) => {
      const data = fs.readFileSync(path.join(templatesDir, file), "utf8");
      const json = JSON.parse(data);
      return { name: file.replace(/\.json$/, ""), ...json };
    });
    res.json(templates);
  } catch (e) {
    res.status(500).json({ error: "Failed to load templates" });
  }
});

app.get("/export-agents", (_req, res) => {
  const agentsDir = path.join(__dirname, "../../../apps/backend/src/agents");
  try {
    const entries = fs.readdirSync(agentsDir, { withFileTypes: true });
    const agents = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => ({ name: e.name, url: `http://${e.name}:4000` }));
    res.json(agents);
  } catch (err) {
    console.error("Failed to load agents", err);
    res.status(500).json({ error: "Failed to load agents" });
  }
});

app.get("/healthz", (_, res) => res.send("OK"));
app.get("/", (_, res) => res.json({ service: "AgentForgeHQ API" }));

interface Message {
  id: number;
  content: string;
}


const messages: Message[] = [];
let nextId = 1;

app.get("/chat", (_req, res) => {
  res.json(messages);
});

app.post("/chat", (req, res) => {
  const message: Message = { id: nextId++, content: req.body.content };
  messages.push(message);
  res.json(message);
});
app.post("/register", async (req, res) => {
  const supabase = getSupabaseClient();
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post("/login", async (req, res) => {
  const supabase = getSupabaseClient();
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post("/validate-agent", (req, res) => {
  const result = agentSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.errors });
  }
  res.json({ valid: true });
});

app.post("/generate-ai-agent", async (req, res) => {
  const { prompt, deepResearch } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  const promptText = deepResearch ? deepSystemPrompt : systemPrompt;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: promptText },
        { role: "user", content: prompt },
      ],
    });
    const content = completion.choices[0].message?.content || "";
    try {
      res.json(JSON.parse(content));
    } catch (err) {
      console.error("Failed to parse JSON:", err);
      res.status(500).json({ error: "Invalid JSON response" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate agent" });
  }

});

app.post("/subscribe", async (req, res) => {
  const supabase = getSupabaseClient();
  const { userId, priceId } = req.body;
  if (!userId || !priceId) {
    return res.status(400).json({ error: "Missing userId or priceId" });
  }
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin || "http://localhost:5173"}/success`,
      cancel_url: `${req.headers.origin || "http://localhost:5173"}/canceled`,
    });

    await supabase.from("user_plans").upsert({ user_id: userId, price_id: priceId });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

app.post("/save-agent", async (req, res) => {
  const supabase = getSupabaseClient();
  const result = agentSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.errors });
  }
  const { error } = await supabase.from("agents").insert(result.data);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json({ success: true });
});

app.post("/create-agent", async (req, res) => {
  const supabase = getSupabaseClient();
  const { messages } = req.body;
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "messages must be an array" });
  }
  const { error } = await supabase
    .from("agents")
    .insert({ messages });
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json({ success: true });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on ${port}`));
