import { generateText } from "./openaiClient.js";
import { normalizePersona, personaPrompts } from "./personaPrompts.js";

export async function generatePersonaReply(postContent, personaInput) {
  const persona = normalizePersona(personaInput);
  const systemPrompt = `${personaPrompts[persona]} Never include emojis. Avoid insults and slurs.`;
  const userPrompt = `Original post:\n${postContent}\n\nWrite one concise reply (max 280 chars preferred).`;

  const modelReply = await generateText({
    systemPrompt,
    userPrompt,
    temperature: persona === "unhinged" ? 0.9 : 0.6
  });

  return { persona, generatedReply: String(modelReply || "").trim() };
}
