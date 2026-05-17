import type { HostConfig } from "./types.ts";

export const kiroHost: HostConfig = {
  name: "Kiro",
  flag: "kiro",
  installPath: "~/.kiro/skills/ai-skills",
  contextHomeRelative: ".kiro/KIRO.md",
  contextFormat: "markdown",
  skillLoader: "directory-scan",
  sessionHookPath: "~/.kiro/skills/ai-skills/.hooks/session-start",
  supportedSince: "1.0.0",
  supportsAutoUpdate: true,
};
