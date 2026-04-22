# HideMail — Chrome Extension (MVP)

A lightweight Chrome extension that hides specific email addresses on webpages while screen sharing, recording, or streaming.

---

## ✨ What it does

HideMail replaces selected email addresses with custom text across webpages.

Example:

```
Welcome back, [mantha@gmail.com](mailto:mantha@gmail.com)
→ Welcome back, [hidden email]
```

---

## 🎯 Use cases

- Screen sharing in meetings
- Recording tutorials
- Live streaming
- Product demos
- Avoid leaking personal email accidentally

---

## 🚀 Features (MVP)

- Add one or more emails to hide
- Custom replacement per email
- Global enable/disable toggle
- Works on dynamic apps (React, Angular, etc.)
- Replaces:
  - visible text
  - anchor text
  - `mailto:` links
- Site allowlist / blocklist (basic)

---

## 🏁 Getting started

```bash
npm install
npm run build
```

Then:

1. Open Chrome → `chrome://extensions`
2. Enable Developer Mode
3. Load unpacked → select `dist/`

---

## 📦 Tech stack

- TypeScript
- Chrome Extension Manifest V3
- Vite (build)
- Chrome Storage API

---

## 📁 Project structure

```
hide-mail-extension/
├─ public/
│  ├─ manifest.json
│  └─ icons/
├─ src/
│  ├─ background/
│  │  └─ service-worker.ts
│  ├─ content/
│  │  ├─ content-script.ts
│  │  ├─ dom-walker.ts
│  │  └─ replacer.ts
│  ├─ popup/
│  │  ├─ popup.html
│  │  └─ popup.ts
│  ├─ options/
│  │  ├─ options.html
│  │  └─ options.ts
│  ├─ shared/
│  │  ├─ types.ts
│  │  └─ storage.ts
│  └─ utils/
│     └─ regex.ts
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

---

## 🧠 Data model

```ts
export type HideRule = {
  id: string;
  target: string;
  replacement: string;
  enabled: boolean;
};

export type Settings = {
  enabled: boolean;
  rules: HideRule[];
  siteMode: "all" | "allowlist" | "blocklist";
  allowlist: string[];
  blocklist: string[];
};
```

---

## 🧩 Implementation Details

### 🔧 manifest.json

```json
{
  "manifest_version": 3,
  "name": "HideMail",
  "version": "0.1.0",
  "description": "Hide selected email addresses on webpages.",
  "permissions": ["storage", "tabs"],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "action": {
    "default_popup": "popup/popup.html"
  },
  "options_page": "options/options.html",
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/content-script.js"],
      "run_at": "document_idle"
    }
  ]
}
```

### 🧩 Storage helper

```ts
// src/shared/storage.ts
import { Settings } from "./types";

const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  rules: [],
  siteMode: "all",
  allowlist: [],
  blocklist: []
};

export async function getSettings(): Promise<Settings> {
  const data = await chrome.storage.sync.get("settings");
  return data.settings || DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings) {
  await chrome.storage.sync.set({ settings });
}
```

### 🔍 Regex util

```ts
// src/utils/regex.ts
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
```

### 🧠 DOM walker

```ts
// src/content/dom-walker.ts
export function walkTextNodes(root: Node, callback: (node: Text) => void) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;

        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        const tag = parent.tagName.toLowerCase();

        if (
          tag === "script" ||
          tag === "style" ||
          tag === "noscript" ||
          parent.isContentEditable
        ) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let current;
  while ((current = walker.nextNode())) {
    callback(current as Text);
  }
}
```

### 🔁 Replacer logic

```ts
// src/content/replacer.ts
import { HideRule } from "../shared/types";
import { escapeRegExp } from "../utils/regex";

export function applyRulesToText(text: string, rules: HideRule[]): string {
  let result = text;

  for (const rule of rules) {
    if (!rule.enabled) continue;

    const regex = new RegExp(escapeRegExp(rule.target), "gi");
    result = result.replace(regex, rule.replacement);
  }

  return result;
}
```

### ⚙️ Content script

```ts
// src/content/content-script.ts
import { getSettings } from "../shared/storage";
import { walkTextNodes } from "./dom-walker";
import { applyRulesToText } from "./replacer";

let replacementCount = 0;

function processNode(node: Node, rules) {
  walkTextNodes(node, (textNode) => {
    const original = textNode.nodeValue || "";
    const updated = applyRulesToText(original, rules);

    if (original !== updated) {
      textNode.nodeValue = updated;
      replacementCount++;
    }
  });

  // mailto links
  const anchors = (node as Element).querySelectorAll?.("a[href^='mailto:']");
  anchors?.forEach((a: HTMLAnchorElement) => {
    const href = a.getAttribute("href") || "";
    rules.forEach((rule) => {
      if (rule.enabled && href.includes(rule.target)) {
        a.setAttribute("href", href.replace(rule.target, rule.replacement));
      }
    });
  });
}

async function init() {
  const settings = await getSettings();
  if (!settings.enabled) return;

  const rules = settings.rules.filter((r) => r.enabled);
  if (!rules.length) return;

  processNode(document.body, rules);

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        processNode(node, rules);
      });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

init();
```

### 🪟 Popup UI (minimal)

```html
<!-- src/popup/popup.html -->
<!DOCTYPE html>
<html>
  <body>
    <h3>HideMail</h3>

    <input id="email" placeholder="email to hide" />
    <input id="replacement" placeholder="replacement" />

    <button id="add">Add</button>

    <ul id="rules"></ul>

    <script src="popup.js"></script>
  </body>
</html>
```

### 🧠 Popup logic

```ts
// src/popup/popup.ts
import { getSettings, saveSettings } from "../shared/storage";

const emailInput = document.getElementById("email") as HTMLInputElement;
const replacementInput = document.getElementById("replacement") as HTMLInputElement;
const addBtn = document.getElementById("add");
const list = document.getElementById("rules");

async function render() {
  const settings = await getSettings();

  list.innerHTML = "";

  settings.rules.forEach((rule) => {
    const li = document.createElement("li");
    li.textContent = `${rule.target} → ${rule.replacement}`;
    list.appendChild(li);
  });
}

addBtn?.addEventListener("click", async () => {
  const settings = await getSettings();

  settings.rules.push({
    id: crypto.randomUUID(),
    target: emailInput.value,
    replacement: replacementInput.value,
    enabled: true
  });

  await saveSettings(settings);
  render();
});

render();
```

---

## 🧪 How it works (flow)

1. Load settings from `chrome.storage`
2. Scan page text nodes
3. Replace matching emails
4. Observe DOM changes
5. Replace new content dynamically

---

## ⚠️ Limitations

* Cannot replace:
  * images
  * videos
  * PDFs
  * canvas-rendered content
  * cross-origin iframes
* May not catch emails before initial render (but will update quickly after)

---

## 🔐 Privacy

* No backend
* No tracking
* No data leaves browser
* Everything stored locally

---

## 🚀 Future ideas

* Blur instead of replace
* Support phone numbers / names
* Profiles (demo mode, stream mode)
* Per-site rules
* Regex support
* Hover to reveal original
* Auto-enable during screen share

---

**Protect your personal info while screen sharing.**

Simple, fast, local.
