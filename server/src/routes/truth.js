import { Router } from "express";
import { rewriteTruth } from "../services/truthService.js";

export const truthRouter = Router();

truthRouter.post("/truth", async (req, res) => {
  const { draft_text: draftText } = req.body || {};

  if (!draftText) {
    return res.status(400).json({ error: "draft_text is required" });
  }

  try {
    const rewrittenTruthVersion = await rewriteTruth(String(draftText));
    return res.json({ rewritten_truth_version: rewrittenTruthVersion });
  } catch (error) {
    return res.status(502).json({ error: error.message || "Truth rewrite failed" });
  }
});
