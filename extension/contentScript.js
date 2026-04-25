(function () {
  const platform = detectPlatform(location.hostname);
  if (!platform) return;

  const ui = window.ParallelYouInjectedUI.createPanel();
  let activeComposer = null;
  let generatedReply = "";
  let truthReply = "";
  let lastComposerText = "";
  let config = {
    apiBaseUrl: "http://localhost:8080",
    shadowUserEnabled: false,
    lastSeenScheduledAt: null
  };

  let observeTimer = null;

  init();

  async function init() {
    const cfg = await sendRuntimeMessage({ type: "parallel-you-get-config" });
    if (cfg) config = { ...config, ...cfg };

    ui.shadowToggle.checked = Boolean(config.shadowUserEnabled);
    ui.statusEl.textContent = `Ready on ${platform}`;

    bindUiEvents();
    bindPageEvents();
    refreshScheduledReplies();
    setInterval(refreshScheduledReplies, 20000);
  }

  function bindUiEvents() {
    // Keep platform composer focused when clicking panel controls.
    const focusSafeButtons = [
      ui.generateBtn,
      ui.insertBtn,
      ui.predictBtn,
      ui.truthBtn,
      ui.replyLaterBtn,
      ui.refreshScheduledBtn
    ];
    for (const button of focusSafeButtons) {
      button.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });
    }

    ui.launcher.addEventListener("click", () => {
      ui.container.classList.toggle("hidden");
      if (!ui.container.classList.contains("hidden")) {
        ui.statusEl.textContent = `Active on ${platform}`;
      }
    });

    ui.closeBtn.addEventListener("click", () => {
      ui.container.classList.add("hidden");
    });

    ui.shadowToggle.addEventListener("change", async () => {
      const enabled = ui.shadowToggle.checked;
      config.shadowUserEnabled = enabled;
      await sendRuntimeMessage({ type: "parallel-you-set-shadow-mode", enabled });
      ui.statusEl.textContent = enabled
        ? "Shadow User enabled"
        : "Shadow User disabled";
    });

    ui.generateBtn.addEventListener("click", async () => {
      const text = getComposerText();
      if (!text) {
        ui.statusEl.textContent = "Focus a reply box with text first.";
        return;
      }

      ui.statusEl.textContent = "Generating persona reply...";
      const persona = ui.personaSelect.value;

      const response = await callApi("/generate-reply", "POST", {
        post_content: text,
        persona
      });

      if (!response) return;

      generatedReply = response.generatedReply || "";
      ui.generatedEl.textContent = generatedReply || "No generated reply.";
      ui.statusEl.textContent = "Reply generated.";
    });

    ui.insertBtn.addEventListener("click", () => {
      const candidate = truthReply || generatedReply;
      if (!candidate) {
        ui.statusEl.textContent = "Generate a reply or truth version first.";
        return;
      }
      setComposerText(candidate);
      ui.statusEl.textContent = "Inserted into reply box. Manual post only.";
    });

    ui.predictBtn.addEventListener("click", async () => {
      const text = getComposerText() || lastComposerText;
      if (!text) {
        ui.statusEl.textContent = "Could not detect text in the active reply box.";
        return;
      }

      ui.statusEl.textContent = "Running pre-post prediction...";
      const response = await callApi("/predict", "POST", { draft_text: text });
      if (!response) return;

      const prediction = [
        `Tone: ${response.tone}`,
        `Engagement: ${response.engagement_prediction}`,
        `Risk: ${(response.risk_flags || []).join(", ")}`
      ].join(" | ");
      ui.predictionEl.textContent = prediction;
      ui.statusEl.textContent = "Prediction complete.";
    });

    ui.truthBtn.addEventListener("click", async () => {
      const text = getComposerText();
      if (!text) {
        ui.statusEl.textContent = "Nothing to rewrite.";
        return;
      }

      ui.statusEl.textContent = "Running Truth Mode...";
      const response = await callApi("/truth", "POST", { draft_text: text });
      if (!response) return;

      truthReply = response.rewritten_truth_version || "";
      ui.truthEl.textContent = truthReply || "No truth rewrite generated.";
      ui.statusEl.textContent = "Truth Mode complete.";
    });

    ui.replyLaterBtn.addEventListener("click", async () => {
      const text = getComposerText();
      if (!text) {
        ui.statusEl.textContent = "Nothing to schedule.";
        return;
      }

      const persona = ui.personaSelect.value;
      ui.statusEl.textContent = "Scheduling async reply...";

      const response = await callApi("/schedule-reply", "POST", {
        post_content: text,
        persona
      });
      if (!response) return;

      ui.statusEl.textContent = `Reply scheduled (#${response.scheduled_id}).`;
      refreshScheduledReplies();
    });

    ui.refreshScheduledBtn.addEventListener("click", () => refreshScheduledReplies(true));
  }

  function bindPageEvents() {
    document.addEventListener("focusin", (event) => {
      const composer = resolveComposerFromNode(event.target);
      if (composer) {
        activeComposer = composer;
        lastComposerText = readComposerText(composer) || lastComposerText;
        ui.statusEl.textContent = "Reply input detected.";
      }
    });

    document.addEventListener("selectionchange", () => {
      if (platform !== "linkedin") return;
      const selection = document.getSelection?.();
      if (!selection?.anchorNode) return;
      const composer = resolveComposerFromNode(selection.anchorNode);
      if (!composer) return;
      activeComposer = composer;
      const text = readComposerText(composer);
      if (text) lastComposerText = text;
    });

    document.addEventListener("input", (event) => {
      const composer = resolveComposerFromNode(event.target);
      if (!composer) return;

      activeComposer = composer;
      lastComposerText = readComposerText(activeComposer);
      if (!config.shadowUserEnabled) return;

      const typedText = readComposerText(activeComposer);
      if (!typedText || typedText.trim().length < 6) return;

      clearTimeout(observeTimer);
      observeTimer = setTimeout(() => {
        callApi("/observe", "POST", {
          text: typedText,
          platform,
          timestamp: new Date().toISOString()
        });
      }, 700);
    });

    document.addEventListener("click", (event) => {
      if (!config.shadowUserEnabled) return;
      const text = extractInteractionText(event.target);
      if (!text) return;

      callApi("/observe", "POST", {
        text: `Interacted with: ${text.slice(0, 240)}`,
        platform,
        timestamp: new Date().toISOString()
      });
    });
  }

  async function refreshScheduledReplies(userTriggered = false) {
    const response = await callApi("/scheduled-replies", "GET");
    if (!response?.replies) return;

    const completed = response.replies.filter((item) => item.status === "completed");
    if (completed.length === 0) {
      ui.scheduledEl.textContent = "No async replies yet.";
      return;
    }

    const latest = completed[0];
    ui.scheduledEl.textContent = `You replied while away: ${latest.generatedReply}`;

    if (!config.lastSeenScheduledAt || new Date(latest.completedAt) > new Date(config.lastSeenScheduledAt)) {
      ui.statusEl.textContent = "You replied while away";
      await sendRuntimeMessage({
        type: "parallel-you-set-last-seen",
        timestamp: latest.completedAt
      });
      config.lastSeenScheduledAt = latest.completedAt;
    } else if (userTriggered) {
      ui.statusEl.textContent = "Scheduled replies refreshed.";
    }
  }

  function getComposerText() {
    const composer = findLikelyComposer();
    if (!composer) return lastComposerText;

    activeComposer = composer;
    const text = readComposerText(composer);
    if (text) {
      lastComposerText = text;
      return text;
    }
    return lastComposerText;
  }

  function readComposerText(composer) {
    if (!composer) return "";

    let text = "";
    if (composer.tagName === "TEXTAREA") {
      text = composer.value || "";
    } else {
      text = composer.innerText || composer.textContent || "";
    }

    return text.replace(/\u200B/g, "").replace(/\s+/g, " ").trim();
  }

  function setComposerText(text) {
    activeComposer = findLikelyComposer();
    if (!activeComposer) return;

    if (activeComposer.tagName === "TEXTAREA") {
      activeComposer.value = text;
      activeComposer.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }

    activeComposer.focus();
    document.execCommand("selectAll", false, null);
    document.execCommand("insertText", false, text);
    activeComposer.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function findLikelyComposer() {
    if (isUsableComposer(activeComposer)) {
      return activeComposer;
    }

    const focusedComposer = resolveComposerFromNode(document.activeElement);
    if (isUsableComposer(focusedComposer)) return focusedComposer;

    const selection = document.getSelection?.();
    if (selection?.anchorNode) {
      const selectionComposer = resolveComposerFromNode(selection.anchorNode);
      if (isUsableComposer(selectionComposer)) return selectionComposer;
    }

    if (platform === "linkedin") {
      const linkedInCandidates = [
        ...Array.from(document.querySelectorAll(".comments-comment-box__editor[contenteditable='true']")),
        ...Array.from(document.querySelectorAll(".ql-editor[contenteditable='true']")),
        ...Array.from(document.querySelectorAll("[data-placeholder*='Add a comment'][contenteditable='true']")),
        ...Array.from(document.querySelectorAll("div.editor-content[contenteditable='true']")),
        ...Array.from(document.querySelectorAll("div[contenteditable='true']"))
      ].filter(isUsableComposer);

      if (linkedInCandidates.length > 0) {
        const withText = linkedInCandidates.find((el) => readComposerText(el).length > 0);
        return withText || linkedInCandidates[0];
      }
    }

    const candidates = [
      ...Array.from(document.querySelectorAll('div[role="textbox"][contenteditable="true"][data-testid="tweetTextarea_0"]')),
      ...Array.from(document.querySelectorAll('div[role="textbox"][contenteditable="true"]')),
      ...Array.from(document.querySelectorAll("textarea")),
      ...Array.from(document.querySelectorAll("[contenteditable='true']"))
    ].filter(isUsableComposer);

    if (candidates.length === 0) return null;

    const withText = candidates.find((el) => readComposerText(el).length > 0);
    return withText || candidates[0];
  }

  function resolveComposerFromNode(node) {
    const element =
      node instanceof HTMLElement
        ? node
        : node instanceof Node
          ? node.parentElement
          : null;
    if (!element) return null;
    if (element.closest(".parallel-you-panel")) return null;

    if (isComposerElement(element)) return element;

    const closest = element.closest('textarea, div[role="textbox"], [contenteditable="true"]');
    return closest instanceof HTMLElement ? closest : null;
  }

  function isComposerElement(element) {
    if (!element || !(element instanceof HTMLElement)) return false;
    if (element.closest(".parallel-you-panel")) return false;

    if (element.tagName === "TEXTAREA") return true;
    if (element.getAttribute("contenteditable") === "true") return true;
    return element.getAttribute("role") === "textbox";
  }

  function isUsableComposer(element) {
    if (!element || !document.contains(element)) return false;
    if (!isComposerElement(element)) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function extractInteractionText(startElement) {
    const element = startElement instanceof Element ? startElement : null;
    if (!element) return "";

    const card = element.closest("article") || element.closest('[data-testid="tweet"]') || element.closest("div.feed-shared-update-v2");
    if (!card) return "";

    const text = card.innerText || "";
    return text.replace(/\s+/g, " ").trim();
  }

  async function callApi(endpoint, method, payload) {
    try {
      const message = {
        type: "parallel-you-api",
        endpoint,
        method,
        payload
      };
      const response = await sendRuntimeMessage(message);
      return response;
    } catch (error) {
      ui.statusEl.textContent = `API error: ${error.message}`;
      return null;
    }
  }

  function sendRuntimeMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        const err = chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message));
          return;
        }

        if (!response?.ok) {
          reject(new Error(response?.error || "Unknown extension error"));
          return;
        }

        resolve(response.data || response);
      });
    });
  }

  function detectPlatform(hostname) {
    if (hostname.includes("x.com") || hostname.includes("twitter.com")) return "twitter";
    if (hostname.includes("linkedin.com")) return "linkedin";
    if (hostname.includes("reddit.com")) return "reddit";
    return null;
  }
})();
