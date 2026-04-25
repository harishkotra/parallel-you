import { Router } from "express";
import { generatePersonaReply } from "../services/replyService.js";

export const generateReplyRouter = Router();

generateReplyRouter.post("/generate-reply", async (req, res) => {
  const { post_content: postContent, persona } = req.body || {};

  if (!postContent) {
    return res.status(400).json({ error: "post_content is required" });
  }

  try {
    const result = await generatePersonaReply(String(postContent), String(persona || "professional"));
    return res.json(result);
  } catch (error) {
    return res.status(502).json({ error: error.message || "Model generation failed" });
  }
});
