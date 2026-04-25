const el = {
  postContent: document.getElementById("postContent"),
  draftText: document.getElementById("draftText"),
  persona: document.getElementById("persona"),
  generateBtn: document.getElementById("generateBtn"),
  predictBtn: document.getElementById("predictBtn"),
  truthBtn: document.getElementById("truthBtn"),
  replyLaterBtn: document.getElementById("replyLaterBtn"),
  generatedReply: document.getElementById("generatedReply"),
  prediction: document.getElementById("prediction"),
  truth: document.getElementById("truth"),
  scheduled: document.getElementById("scheduled"),
  status: document.getElementById("status"),
  webStoreBtn: document.getElementById("webStoreBtn"),
  installNote: document.getElementById("installNote")
};

async function api(path, payload, method = "POST") {
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "GET" ? undefined : JSON.stringify(payload || {})
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

function setStatus(text) {
  el.status.textContent = text;
}

async function loadConfig() {
  try {
    const response = await api("/app-config", null, "GET");
    if (response.chrome_web_store_url) {
      el.webStoreBtn.href = response.chrome_web_store_url;
      el.installNote.textContent = "Install from the Chrome Web Store for the smoothest non-developer install flow.";
    } else {
      el.webStoreBtn.style.display = "none";
      el.installNote.textContent = "Web Store URL not configured yet. Use the zip download + Load unpacked path.";
    }
  } catch {
    el.webStoreBtn.style.display = "none";
  }
}

el.generateBtn.addEventListener("click", async () => {
  const post = el.postContent.value.trim();
  if (!post) return setStatus("Enter post context first.");
  setStatus("Generating reply...");

  try {
    const data = await api("/generate-reply", {
      post_content: post,
      persona: el.persona.value
    });
    el.generatedReply.textContent = data.generatedReply || "No response";
    setStatus("Reply generated.");
  } catch (error) {
    setStatus(`Error: ${error.message}`);
  }
});

el.predictBtn.addEventListener("click", async () => {
  const draft = el.draftText.value.trim() || el.postContent.value.trim();
  if (!draft) return setStatus("Enter draft text first.");
  setStatus("Predicting tone and risk...");

  try {
    const data = await api("/predict", { draft_text: draft });
    el.prediction.textContent = `Tone: ${data.tone}\nEngagement: ${data.engagement_prediction}\nRisk: ${(data.risk_flags || []).join(", ")}`;
    setStatus("Prediction complete.");
  } catch (error) {
    setStatus(`Error: ${error.message}`);
  }
});

el.truthBtn.addEventListener("click", async () => {
  const draft = el.draftText.value.trim() || el.postContent.value.trim();
  if (!draft) return setStatus("Enter draft text first.");
  setStatus("Running Truth Mode...");

  try {
    const data = await api("/truth", { draft_text: draft });
    el.truth.textContent = data.rewritten_truth_version || "No truth rewrite";
    setStatus("Truth Mode complete.");
  } catch (error) {
    setStatus(`Error: ${error.message}`);
  }
});

el.replyLaterBtn.addEventListener("click", async () => {
  const post = el.postContent.value.trim();
  if (!post) return setStatus("Enter post context first.");
  setStatus("Scheduling async reply...");

  try {
    const data = await api("/schedule-reply", {
      post_content: post,
      persona: el.persona.value
    });
    setStatus(`Scheduled reply #${data.scheduled_id}. Check back soon.`);
    await refreshScheduledReplies();
  } catch (error) {
    setStatus(`Error: ${error.message}`);
  }
});

async function refreshScheduledReplies() {
  try {
    const data = await api("/scheduled-replies", null, "GET");
    const completed = (data.replies || []).filter((r) => r.status === "completed");
    if (completed.length === 0) {
      el.scheduled.textContent = "No completed scheduled replies yet.";
      return;
    }

    const latest = completed[0];
    el.scheduled.textContent = `You replied while away:\n${latest.generatedReply}`;
  } catch {}
}

loadConfig();
refreshScheduledReplies();
setInterval(refreshScheduledReplies, 10000);
