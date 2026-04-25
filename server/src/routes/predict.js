import { Router } from "express";
import { predictDraft } from "../services/predictService.js";

export const predictRouter = Router();

predictRouter.post("/predict", async (req, res) => {
  const { draft_text: draftText } = req.body || {};

  if (!draftText) {
    return res.status(400).json({ error: "draft_text is required" });
  }

  try {
    const prediction = await predictDraft(String(draftText));
    return res.json(prediction);
  } catch (error) {
    return res.status(502).json({ error: error.message || "Prediction failed" });
  }
});
