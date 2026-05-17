import type { HostConfig } from "./types.ts";

export const gbrainHost: HostConfig = {
  name: "GBrain",
  flag: "gbrain",
  installPath: "~/.gbrain/skills/ai-skills",
  contextHomeRelative: ".gbrain/GBRAIN.md",
  contextFormat: "markdown",
  skillLoader: "directory-scan",
  sessionHookPath: "~/.gbrain/skills/ai-skills/.hooks/session-start",
  supportedSince: "1.0.0",
  supportsAutoUpdate: true,
};
