import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors(), express.json());

app.get("/healthz", (_, res) => res.send("OK"));
app.get("/", (_, res) => res.json({ service: "AgentForgeHQ API" }));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on ${port}`));
