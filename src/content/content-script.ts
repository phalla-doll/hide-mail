import { getSettings } from "../shared/storage";
import { HideRule } from "../shared/types";
import { walkTextNodes } from "./dom-walker";
import { applyRulesToText } from "./replacer";

let replacementCount = 0;

function processNode(node: Node, rules: HideRule[]): void {
  walkTextNodes(node, (textNode: Text) => {
    const original = textNode.nodeValue || "";
    const updated = applyRulesToText(original, rules);

    if (original !== updated) {
      textNode.nodeValue = updated;
      replacementCount++;
    }
  });

  const anchors = (node as Element).querySelectorAll<HTMLAnchorElement>("a[href^='mailto:']");
  for (const a of anchors) {
    const href = a.getAttribute("href") || "";
    rules.forEach((rule: HideRule) => {
      if (rule.enabled && href.includes(rule.target)) {
        a.setAttribute("href", href.replace(rule.target, rule.replacement));
      }
    });
  }
}

function isSiteAllowed(settings: { siteMode: string; allowlist: string[]; blocklist: string[] }): boolean {
  const hostname = window.location.hostname;

  if (settings.siteMode === "allowlist") {
    return settings.allowlist.some(domain => hostname.includes(domain));
  }

  if (settings.siteMode === "blocklist") {
    return !settings.blocklist.some(domain => hostname.includes(domain));
  }

  return true;
}

async function init(): Promise<void> {
  const settings = await getSettings();

  if (!settings.enabled) return;

  if (!isSiteAllowed(settings)) return;

  const rules = settings.rules.filter((r: HideRule) => r.enabled);
  if (!rules.length) return;

  processNode(document.body, rules);

  const observer = new MutationObserver((mutations: MutationRecord[]) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node: Node) => {
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
