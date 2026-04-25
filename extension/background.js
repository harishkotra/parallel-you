const DEFAULT_CONFIG = {
  apiBaseUrl: "https://parallel-you-backend-330015043682.us-central1.run.app",
  shadowUserEnabled: false
};

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.sync.get(["apiBaseUrl"]);
  const local = await chrome.storage.local.get(["shadowUserEnabled"]);

  if (!existing.apiBaseUrl) {
    await chrome.storage.sync.set({ apiBaseUrl: DEFAULT_CONFIG.apiBaseUrl });
  }

  if (typeof local.shadowUserEnabled === "undefined") {
    await chrome.storage.local.set({ shadowUserEnabled: DEFAULT_CONFIG.shadowUserEnabled });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "parallel-you-api") {
    handleApiCall(message)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "parallel-you-get-config") {
    Promise.all([
      chrome.storage.sync.get(["apiBaseUrl"]),
      chrome.storage.local.get(["shadowUserEnabled", "lastSeenScheduledAt"])
    ]).then(([syncData, localData]) => {
      sendResponse({
        ok: true,
        data: {
          apiBaseUrl: syncData.apiBaseUrl || DEFAULT_CONFIG.apiBaseUrl,
          shadowUserEnabled: Boolean(localData.shadowUserEnabled),
          lastSeenScheduledAt: localData.lastSeenScheduledAt || null
        }
      });
    });
    return true;
  }

  if (message?.type === "parallel-you-set-shadow-mode") {
    chrome.storage.local
      .set({ shadowUserEnabled: Boolean(message.enabled) })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "parallel-you-set-last-seen") {
    chrome.storage.local
      .set({ lastSeenScheduledAt: message.timestamp || new Date().toISOString() })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
});

async function handleApiCall(message) {
  const syncData = await chrome.storage.sync.get(["apiBaseUrl"]);
  const apiBaseUrl = syncData.apiBaseUrl || DEFAULT_CONFIG.apiBaseUrl;

  const endpoint = String(message.endpoint || "");
  if (!endpoint.startsWith("/")) {
    throw new Error("Invalid endpoint");
  }

  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    method: message.method || "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: message.payload ? JSON.stringify(message.payload) : undefined
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.error || `Request failed (${response.status})`);
  }

  return json;
}
