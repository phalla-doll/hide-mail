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
