import type { HostConfig } from "./types.ts";

export const hermesHost: HostConfig = {
  name: "Hermes",
  flag: "hermes",
  installPath: "~/.hermes/skills/ai-skills",
  contextHomeRelative: ".hermes/HERMES.md",
  contextFormat: "markdown",
  skillLoader: "directory-scan",
  sessionHookPath: "~/.hermes/skills/ai-skills/.hooks/session-start",
  supportedSince: "1.0.0",
  supportsAutoUpdate: true,
};
