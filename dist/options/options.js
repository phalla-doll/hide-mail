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

  // src/options/options.ts
  var enabledCheckbox = document.getElementById("enabled");
  var siteModeSelect = document.getElementById("siteMode");
  var allowlistInput = document.getElementById("allowlistInput");
  var blocklistInput = document.getElementById("blocklistInput");
  var addAllowlistBtn = document.getElementById("addAllowlist");
  var addBlocklistBtn = document.getElementById("addBlocklist");
  var allowlistEl = document.getElementById("allowlist");
  var blocklistEl = document.getElementById("blocklist");
  var allowlistSection = document.getElementById("allowlistSection");
  var blocklistSection = document.getElementById("blocklistSection");
  var saveStatus = document.getElementById("saveStatus");
  async function render() {
    const settings = await getSettings();
    enabledCheckbox.checked = settings.enabled;
    siteModeSelect.value = settings.siteMode;
    showHideSections(settings.siteMode);
    if (allowlistEl) {
      allowlistEl.innerHTML = "";
      settings.allowlist.forEach((domain) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${domain}</span>`;
        const btn = document.createElement("button");
        btn.className = "remove-btn";
        btn.textContent = "Remove";
        btn.addEventListener("click", async () => {
          const s = await getSettings();
          s.allowlist = s.allowlist.filter((d) => d !== domain);
          await saveSettings(s);
          render();
        });
        li.appendChild(btn);
        allowlistEl.appendChild(li);
      });
    }
    if (blocklistEl) {
      blocklistEl.innerHTML = "";
      settings.blocklist.forEach((domain) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${domain}</span>`;
        const btn = document.createElement("button");
        btn.className = "remove-btn";
        btn.textContent = "Remove";
        btn.addEventListener("click", async () => {
          const s = await getSettings();
          s.blocklist = s.blocklist.filter((d) => d !== domain);
          await saveSettings(s);
          render();
        });
        li.appendChild(btn);
        blocklistEl.appendChild(li);
      });
    }
  }
  function showHideSections(mode) {
    if (allowlistSection) {
      allowlistSection.style.display = mode === "allowlist" ? "block" : "none";
    }
    if (blocklistSection) {
      blocklistSection.style.display = mode === "blocklist" ? "block" : "none";
    }
  }
  async function showSaveStatus() {
    if (saveStatus) {
      saveStatus.className = "save-status success";
      saveStatus.textContent = "Settings saved!";
      saveStatus.style.display = "block";
      setTimeout(() => {
        saveStatus.style.display = "none";
      }, 2e3);
    }
  }
  enabledCheckbox?.addEventListener("change", async () => {
    const settings = await getSettings();
    settings.enabled = enabledCheckbox.checked;
    await saveSettings(settings);
    showSaveStatus();
  });
  siteModeSelect?.addEventListener("change", async () => {
    const settings = await getSettings();
    settings.siteMode = siteModeSelect.value;
    await saveSettings(settings);
    showHideSections(settings.siteMode);
    showSaveStatus();
  });
  addAllowlistBtn?.addEventListener("click", async () => {
    const domain = allowlistInput.value.trim();
    if (!domain) return;
    const settings = await getSettings();
    if (!settings.allowlist.includes(domain)) {
      settings.allowlist.push(domain);
      await saveSettings(settings);
    }
    allowlistInput.value = "";
    render();
  });
  addBlocklistBtn?.addEventListener("click", async () => {
    const domain = blocklistInput.value.trim();
    if (!domain) return;
    const settings = await getSettings();
    if (!settings.blocklist.includes(domain)) {
      settings.blocklist.push(domain);
      await saveSettings(settings);
    }
    blocklistInput.value = "";
    render();
  });
  render();
})();
