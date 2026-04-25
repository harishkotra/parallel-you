import { generateText } from "./openaiClient.js";

export async function rewriteTruth(draftText) {
  const systemPrompt = `Rewrite the user's draft as: "what you actually mean but wouldn't say".
Keep it sharp but safe. No slurs, threats, or harassment.
Return only the rewritten text.`;

  const userPrompt = `Draft:\n${draftText}`;

  const rewritten = await generateText({
    systemPrompt,
    userPrompt,
    temperature: 0.7
  });

  return String(rewritten || "").trim();
}
