import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config, hasOpenAiKey } from "./config.js";
import { observeRouter } from "./routes/observe.js";
import { generateReplyRouter } from "./routes/generateReply.js";
import { predictRouter } from "./routes/predict.js";
import { truthRouter } from "./routes/truth.js";
import { scheduleReplyRouter } from "./routes/scheduleReply.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "../public");

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(publicDir));

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "parallel-you-backend",
    openai_configured: hasOpenAiKey,
    now: new Date().toISOString()
  });
});

app.get("/app-config", (req, res) => {
  res.json({
    chrome_web_store_url: config.chromeWebStoreUrl || null
  });
});

app.get("/privacy", (req, res) => {
  return res.sendFile(path.join(publicDir, "privacy.html"));
});

app.use(observeRouter);
app.use(generateReplyRouter);
app.use(predictRouter);
app.use(truthRouter);
app.use(scheduleReplyRouter);

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/observe") || req.path.startsWith("/generate-reply") || req.path.startsWith("/predict") || req.path.startsWith("/truth") || req.path.startsWith("/schedule-reply") || req.path.startsWith("/scheduled-replies") || req.path.startsWith("/health") || req.path.startsWith("/app-config") || req.path.startsWith("/privacy")) {
    return next();
  }
  return res.sendFile(path.join(publicDir, "index.html"));
});

app.use((error, req, res, next) => {
  console.error("Unhandled error", error);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(config.port, () => {
  console.log(`Parallel You backend listening on port ${config.port}`);
});
