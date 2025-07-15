import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { agentSchema } from "../../validation/agentSchema";
import { getSupabaseClient } from "./supabaseClient";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

const app = express();
app.use(cors(), express.json());

const templatesDir = path.join(__dirname, "../templates");

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

app.get("/healthz", (_, res) => res.send("OK"));
app.get("/", (_, res) => res.json({ service: "AgentForgeHQ API" }));

interface Message {
  id: number;
  content: string;
}

// simple in-memory fallback
const messages: Message[] = [];

app.get("/chat", async (_req, res) => {
  const { data, error } = await supabase.from("chat_messages").select("*").order("id");
  if (error) return res.status(400).json({ error: error.message });
  res.json(data ?? messages);
});

app.post("/chat", async (req, res) => {
  const { content } = req.body;
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ content })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  messages.push({ id: data.id, content: data.content });
  res.json(data);
});

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post("/login", async (req, res) => {
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

app.post("/generate-ai-agent", (req, res) => {
  const { template, deepResearch } = req.body;
  const spec = {
    template,
    deepResearch: !!deepResearch,
    generatedAt: new Date().toISOString(),
  };
  res.json(spec);
});

app.post("/save-agent", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;
  const client = getSupabaseClient(token);
  const { data, error } = await client.from("user_agents").insert(req.body).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post("/create-agent", async (req, res) => {
  const { messages: chat } = req.body as { messages: Message[] };
  const name = `Agent ${Date.now()}`;
  const description = chat[chat.length - 1]?.content || "Created from chat";
  const { data, error } = await supabase.from("user_agents").insert({ name, description }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post("/subscribe", async (req, res) => {
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

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on ${port}`));
