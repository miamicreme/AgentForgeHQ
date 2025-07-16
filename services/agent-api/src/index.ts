import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";


import Stripe from "stripe";
import { agentSchema } from "../../validation/agentSchema";
import { getSupabaseClient } from "./supabaseClient";
import openai from "./openai";


dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10',
});

const app = express();
app.use(cors(), express.json());

const templatesDir = path.join(__dirname, "../templates");
const systemPrompt = fs.readFileSync(
  path.join(__dirname, "../manual/system-prompt.txt"),
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
  const { template, deepResearch } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify({ template, deepResearch }) },
      ],
    });
    const content = completion.choices[0].message?.content || "{}";
    res.json(JSON.parse(content));
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

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on ${port}`));
