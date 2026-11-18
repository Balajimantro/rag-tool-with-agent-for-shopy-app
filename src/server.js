import express from "express";
import { config } from "./config.js";
import { initRag } from "./rag.js";
import { runAgent } from "./agent.js";
import { getCart } from "./cart.js";

const app = express();
app.use(express.json());
app.use(express.static(config.paths.public)); // simple UI

// POST /ask  body: { "message": "...", "history": [ {role, content} ] }
app.post("/ask", async (req, res) => {
  const { message, history } = req.body || {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required" });
  }
  try {
    const result = await runAgent(message, Array.isArray(history) ? history : []);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /cart
app.get("/cart", async (_req, res) => {
  try {
    res.json(await getCart());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

await initRag();
app.listen(config.port, () => console.log(`Running on http://localhost:${config.port}`));
