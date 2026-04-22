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
