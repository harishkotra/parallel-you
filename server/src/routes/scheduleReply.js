import { Router } from "express";
import { scheduleReply } from "../services/schedulerService.js";
import { store } from "../storage/memoryStore.js";

export const scheduleReplyRouter = Router();

scheduleReplyRouter.post("/schedule-reply", (req, res) => {
  const { post_content: postContent, persona } = req.body || {};

  if (!postContent) {
    return res.status(400).json({ error: "post_content is required" });
  }

  const scheduled = scheduleReply({
    postContent: String(postContent),
    persona: String(persona || "professional")
  });

  return res.json({
    scheduled_id: scheduled.id,
    status: scheduled.status,
    message: "Reply scheduled. Check /scheduled-replies shortly."
  });
});

scheduleReplyRouter.get("/scheduled-replies", (req, res) => {
  return res.json({ replies: store.getScheduledReplies() });
});
