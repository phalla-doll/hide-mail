import { getSettings, saveSettings } from "../shared/storage";
import { HideRule } from "../shared/types";

const emailInput = document.getElementById("email") as HTMLInputElement;
const replacementInput = document.getElementById("replacement") as HTMLInputElement;
const addBtn = document.getElementById("add") as HTMLButtonElement | null;
const list = document.getElementById("rules") as HTMLUListElement | null;
const enabledCheckbox = document.getElementById("enabled") as HTMLInputElement;
const openOptionsBtn = document.getElementById("openOptions");

async function render(): Promise<void> {
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

    settings.rules.forEach((rule: HideRule) => {
      const li = document.createElement("li");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = rule.enabled;
      checkbox.addEventListener("change", async () => {
        const s = await getSettings();
        const r = s.rules.find((r: HideRule) => r.id === rule.id);
        if (r) {
          r.enabled = checkbox.checked;
          await saveSettings(s);
        }
      });

      const text = document.createElement("span");
      text.className = "rule-text";
      text.textContent = `${rule.target} → ${rule.replacement}`;

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "×";
      deleteBtn.type = "button";
      deleteBtn.setAttribute("aria-label", `Delete rule for ${rule.target}`);
      deleteBtn.title = "Delete rule";
      deleteBtn.addEventListener("click", async () => {
        const s = await getSettings();
        s.rules = s.rules.filter((r: HideRule) => r.id !== rule.id);
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
