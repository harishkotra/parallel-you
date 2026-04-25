import { generateJson } from "./openaiClient.js";

const TONES = ["confident", "defensive", "aggressive", "neutral"];
const ENGAGEMENT = ["low", "medium", "high"];
const FLAGS = ["controversial", "polarizing", "safe"];

function normalizePrediction(result) {
  const tone = TONES.includes(result?.tone) ? result.tone : "neutral";
  const engagementPrediction = ENGAGEMENT.includes(result?.engagement_prediction)
    ? result.engagement_prediction
    : "medium";

  let riskFlags = Array.isArray(result?.risk_flags) ? result.risk_flags : ["safe"];
  riskFlags = riskFlags.filter((flag) => FLAGS.includes(flag));
  if (riskFlags.length === 0) riskFlags = ["safe"];

  return { tone, engagement_prediction: engagementPrediction, risk_flags: riskFlags };
}

export async function predictDraft(draftText) {
  const systemPrompt = `You analyze social post drafts before posting.
Return strict JSON with keys:
- tone: one of confident, defensive, aggressive, neutral
- engagement_prediction: one of low, medium, high
- risk_flags: array containing one or more of controversial, polarizing, safe`;

  const userPrompt = `Draft text:\n${draftText}`;

  const result = await generateJson({ systemPrompt, userPrompt, temperature: 0.1 });
  if (!result) {
    throw new Error("Predict endpoint returned invalid JSON from model");
  }
  return normalizePrediction(result);
}
