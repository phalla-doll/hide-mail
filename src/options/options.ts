import { getSettings, saveSettings } from "../shared/storage";

const enabledCheckbox = document.getElementById("enabled") as HTMLInputElement;
const siteModeSelect = document.getElementById("siteMode") as HTMLSelectElement;
const allowlistInput = document.getElementById("allowlistInput") as HTMLInputElement;
const blocklistInput = document.getElementById("blocklistInput") as HTMLInputElement;
const addAllowlistBtn = document.getElementById("addAllowlist");
const addBlocklistBtn = document.getElementById("addBlocklist");
const allowlistEl = document.getElementById("allowlist");
const blocklistEl = document.getElementById("blocklist");
const allowlistSection = document.getElementById("allowlistSection");
const blocklistSection = document.getElementById("blocklistSection");
const saveStatus = document.getElementById("saveStatus");

async function render(): Promise<void> {
  const settings = await getSettings();

  enabledCheckbox.checked = settings.enabled;
  siteModeSelect.value = settings.siteMode;

  showHideSections(settings.siteMode);

  if (allowlistEl) {
    allowlistEl.innerHTML = "";
    settings.allowlist.forEach((domain: string) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${domain}</span>`;
      const btn = document.createElement("button");
      btn.className = "remove-btn";
      btn.textContent = "Remove";
      btn.addEventListener("click", async () => {
        const s = await getSettings();
        s.allowlist = s.allowlist.filter((d: string) => d !== domain);
        await saveSettings(s);
        render();
      });
      li.appendChild(btn);
      allowlistEl.appendChild(li);
    });
  }

  if (blocklistEl) {
    blocklistEl.innerHTML = "";
    settings.blocklist.forEach((domain: string) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${domain}</span>`;
      const btn = document.createElement("button");
      btn.className = "remove-btn";
      btn.textContent = "Remove";
      btn.addEventListener("click", async () => {
        const s = await getSettings();
        s.blocklist = s.blocklist.filter((d: string) => d !== domain);
        await saveSettings(s);
        render();
      });
      li.appendChild(btn);
      blocklistEl.appendChild(li);
    });
  }
}

function showHideSections(mode: string): void {
  if (allowlistSection) {
    allowlistSection.style.display = mode === "allowlist" ? "block" : "none";
  }
  if (blocklistSection) {
    blocklistSection.style.display = mode === "blocklist" ? "block" : "none";
  }
}

async function showSaveStatus(): Promise<void> {
  if (saveStatus) {
    saveStatus.className = "save-status success";
    saveStatus.textContent = "Settings saved!";
    saveStatus.style.display = "block";
    requestAnimationFrame(() => {
      saveStatus.style.opacity = "1";
    });
    setTimeout(() => {
      saveStatus.style.opacity = "0";
      setTimeout(() => {
        saveStatus.style.display = "none";
      }, 200);
    }, 2000);
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
  settings.siteMode = siteModeSelect.value as "all" | "allowlist" | "blocklist";
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