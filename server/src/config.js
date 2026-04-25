export const config = {
  port: Number(process.env.PORT || 8080),
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  chromeWebStoreUrl: process.env.CHROME_WEB_STORE_URL || ""
};

export const hasOpenAiKey = Boolean(config.openAiApiKey);
