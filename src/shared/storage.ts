import { Settings } from "./types";

const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  rules: [],
  siteMode: "all",
  allowlist: [],
  blocklist: []
};

export async function getSettings(): Promise<Settings> {
  const data = await chrome.storage.sync.get("settings") as { settings?: Settings };
  return data.settings || DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set({ settings });
}