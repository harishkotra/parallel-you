(function () {
  function createPanel() {
    const container = document.createElement("div");
    container.className = "parallel-you-panel hidden";
    container.innerHTML = `
      <div class="py-header">
        <strong>Parallel You</strong>
        <button class="py-close" title="Close">x</button>
      </div>
      <div class="py-section">
        <label>Persona</label>
        <select class="py-persona">
          <option value="professional">Professional</option>
          <option value="unhinged">Unhinged</option>
          <option value="analytical">Analytical</option>
        </select>
      </div>
      <div class="py-section py-row">
        <button class="py-generate">Generate Reply</button>
        <button class="py-insert">Insert</button>
      </div>
      <div class="py-result py-generated">Reply will appear here.</div>
      <div class="py-section py-row">
        <button class="py-predict">Predict</button>
        <button class="py-truth">Truth Mode</button>
      </div>
      <div class="py-result py-prediction">Prediction results will appear here.</div>
      <div class="py-result py-truth-result">Truth version will appear here.</div>
      <div class="py-section py-row">
        <button class="py-reply-later">Reply Later</button>
        <button class="py-refresh-scheduled">Refresh Later Replies</button>
      </div>
      <div class="py-result py-scheduled">No async replies yet.</div>
      <div class="py-section py-row py-shadow">
        <label><input type="checkbox" class="py-shadow-toggle"/> Shadow User (opt-in)</label>
      </div>
      <div class="py-status">Idle</div>
    `;

    document.body.appendChild(container);

    const launcher = document.createElement("button");
    launcher.className = "parallel-you-launcher";
    launcher.textContent = "Parallel You";
    document.body.appendChild(launcher);

    return {
      container,
      launcher,
      closeBtn: container.querySelector(".py-close"),
      personaSelect: container.querySelector(".py-persona"),
      generateBtn: container.querySelector(".py-generate"),
      insertBtn: container.querySelector(".py-insert"),
      predictBtn: container.querySelector(".py-predict"),
      truthBtn: container.querySelector(".py-truth"),
      replyLaterBtn: container.querySelector(".py-reply-later"),
      refreshScheduledBtn: container.querySelector(".py-refresh-scheduled"),
      shadowToggle: container.querySelector(".py-shadow-toggle"),
      generatedEl: container.querySelector(".py-generated"),
      predictionEl: container.querySelector(".py-prediction"),
      truthEl: container.querySelector(".py-truth-result"),
      scheduledEl: container.querySelector(".py-scheduled"),
      statusEl: container.querySelector(".py-status")
    };
  }

  window.ParallelYouInjectedUI = { createPanel };
})();
