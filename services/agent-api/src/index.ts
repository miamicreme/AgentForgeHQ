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
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

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
