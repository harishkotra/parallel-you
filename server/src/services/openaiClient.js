import { config, hasOpenAiKey } from "../config.js";

function buildHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.openAiApiKey}`
  };
}

function assertOpenAiConfigured() {
  if (!hasOpenAiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
}

export async function generateText({ systemPrompt, userPrompt, temperature = 0.7 }) {
  assertOpenAiConfigured();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      model: config.openAiModel,
      temperature,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${details}`);
  }

  const json = await response.json();
  return json?.choices?.[0]?.message?.content?.trim() || "";
}

export async function generateJson({ systemPrompt, userPrompt, temperature = 0.2 }) {
  assertOpenAiConfigured();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      model: config.openAiModel,
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${details}`);
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content || "{}";

  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}
