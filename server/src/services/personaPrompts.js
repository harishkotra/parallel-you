export const personaPrompts = {
  professional:
    "Respond in a polite, thoughtful, and professional tone. Add value. Keep it concise enough for a social reply.",
  unhinged:
    "Respond in a bold, provocative, slightly chaotic way that grabs attention but avoids hate speech or harassment. Keep it socially safe.",
  analytical:
    "Respond with deep reasoning, structured thinking, and insight. Keep it readable for a social post reply."
};

export function normalizePersona(persona) {
  const key = String(persona || "").toLowerCase();
  if (personaPrompts[key]) return key;
  return "professional";
}
