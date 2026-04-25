import { store } from "../storage/memoryStore.js";
import { generatePersonaReply } from "./replyService.js";

export function scheduleReply({ postContent, persona }) {
  const record = store.createScheduledReply({
    postContent,
    persona,
    generatedReply: null
  });

  const delayMs = 8000;
  setTimeout(async () => {
    try {
      const result = await generatePersonaReply(postContent, persona);
      store.completeScheduledReply(record.id, result.generatedReply);
    } catch (error) {
      store.failScheduledReply(record.id, error.message || "Model generation failed");
      console.error("scheduleReply error", error.message);
    }
  }, delayMs);

  return record;
}
