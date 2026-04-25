import { Router } from "express";
import { store } from "../storage/memoryStore.js";

export const observeRouter = Router();

observeRouter.post("/observe", (req, res) => {
  const { text, platform, timestamp } = req.body || {};

  if (!text || !platform) {
    return res.status(400).json({ error: "text and platform are required" });
  }

  store.addObservation({
    text: String(text),
    platform: String(platform),
    timestamp: timestamp || new Date().toISOString()
  });

  return res.json({ ok: true });
});

observeRouter.get("/observe/recent", (req, res) => {
  const limit = Number(req.query.limit || 20);
  return res.json({ observations: store.getRecentObservations(limit) });
});
