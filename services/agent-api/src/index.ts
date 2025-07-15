import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.VITE_SUPABASE_ANON_KEY as string
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

app.post("/generate-ai-agent", (req, res) => {
  const { template, deepResearch } = req.body;
  const spec = {
    template,
    deepResearch: !!deepResearch,
    generatedAt: new Date().toISOString(),
  };
  res.json(spec);
});

app.post("/save-agent", (req, res) => {
  // placeholder save logic
  res.json({ saved: true, spec: req.body });
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
