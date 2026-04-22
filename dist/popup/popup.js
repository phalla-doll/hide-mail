"use strict";
(() => {
  // src/shared/storage.ts
  var DEFAULT_SETTINGS = {
    enabled: true,
    rules: [],
    siteMode: "all",
    allowlist: [],
    blocklist: []
  };
  async function getSettings() {
    const data = await chrome.storage.sync.get("settings");
    return data.settings || DEFAULT_SETTINGS;
  }
  async function saveSettings(settings) {
    await chrome.storage.sync.set({ settings });
  }

  // src/popup/popup.ts
  var emailInput = document.getElementById("email");
  var replacementInput = document.getElementById("replacement");
  var addBtn = document.getElementById("add");
  var list = document.getElementById("rules");
  var enabledCheckbox = document.getElementById("enabled");
  var openOptionsBtn = document.getElementById("openOptions");
  async function render() {
    const settings = await getSettings();
    enabledCheckbox.checked = settings.enabled;
    if (list) {
      list.innerHTML = "";
      if (settings.rules.length === 0) {
        const empty = document.createElement("li");
        empty.className = "empty-state";
        empty.textContent = "No rules added yet";
        list.appendChild(empty);
        return;
      }
      settings.rules.forEach((rule) => {
        const li = document.createElement("li");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = rule.enabled;
        checkbox.addEventListener("change", async () => {
          const s = await getSettings();
          const r = s.rules.find((r2) => r2.id === rule.id);
          if (r) {
            r.enabled = checkbox.checked;
            await saveSettings(s);
          }
        });
        const text = document.createElement("span");
        text.className = "rule-text";
        text.textContent = `${rule.target} \u2192 ${rule.replacement}`;
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "\xD7";
        deleteBtn.type = "button";
        deleteBtn.setAttribute("aria-label", `Delete rule for ${rule.target}`);
        deleteBtn.title = "Delete rule";
        deleteBtn.addEventListener("click", async () => {
          const s = await getSettings();
          s.rules = s.rules.filter((r) => r.id !== rule.id);
          await saveSettings(s);
          render();
        });
        li.appendChild(checkbox);
        li.appendChild(text);
        li.appendChild(deleteBtn);
        list.appendChild(li);
      });
    }
  }
  enabledCheckbox?.addEventListener("change", async () => {
    const settings = await getSettings();
    settings.enabled = enabledCheckbox.checked;
    await saveSettings(settings);
  });
  addBtn?.addEventListener("click", async () => {
    const target = emailInput.value.trim();
    const replacement = replacementInput.value.trim();
    if (!target || !replacement) return;
    const settings = await getSettings();
    settings.rules.push({
      id: crypto.randomUUID(),
      target,
      replacement,
      enabled: true
    });
    await saveSettings(settings);
    emailInput.value = "";
    replacementInput.value = "";
    render();
  });
  openOptionsBtn?.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
  render();
})();
