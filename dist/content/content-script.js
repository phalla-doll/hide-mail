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

  // src/content/dom-walker.ts
  function walkTextNodes(root, callback) {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const nodeValue = node.nodeValue;
          if (!nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName.toLowerCase();
          if (tag === "script" || tag === "style" || tag === "noscript" || parent.isContentEditable) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    let current;
    while (current = walker.nextNode()) {
      callback(current);
    }
  }

  // src/utils/regex.ts
  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // src/content/replacer.ts
  function applyRulesToText(text, rules) {
    let result = text;
    for (const rule of rules) {
      if (!rule.enabled) continue;
      const regex = new RegExp(escapeRegExp(rule.target), "gi");
      result = result.replace(regex, rule.replacement);
    }
    return result;
  }

  // src/content/content-script.ts
  var replacementCount = 0;
  function processNode(node, rules) {
    walkTextNodes(node, (textNode) => {
      const original = textNode.nodeValue || "";
      const updated = applyRulesToText(original, rules);
      if (original !== updated) {
        textNode.nodeValue = updated;
        replacementCount++;
      }
    });
    const anchors = node.querySelectorAll("a[href^='mailto:']");
    for (const a of anchors) {
      const href = a.getAttribute("href") || "";
      rules.forEach((rule) => {
        if (rule.enabled && href.includes(rule.target)) {
          a.setAttribute("href", href.replace(rule.target, rule.replacement));
        }
      });
    }
  }
  function isSiteAllowed(settings) {
    const hostname = window.location.hostname;
    if (settings.siteMode === "allowlist") {
      return settings.allowlist.some((domain) => hostname.includes(domain));
    }
    if (settings.siteMode === "blocklist") {
      return !settings.blocklist.some((domain) => hostname.includes(domain));
    }
    return true;
  }
  async function init() {
    const settings = await getSettings();
    if (!settings.enabled) return;
    if (!isSiteAllowed(settings)) return;
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
})();
