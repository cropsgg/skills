import type { HostConfig } from "./types.ts";

export const codexHost: HostConfig = {
  name: "Codex CLI",
  flag: "codex",
  installPath: "~/.codex/skills/ai-skills",
  contextHomeRelative: ".codex/CODEX.md",
  contextFormat: "markdown",
  skillLoader: "directory-scan",
  sessionHookPath: "~/.codex/skills/ai-skills/.hooks/session-start",
  supportedSince: "1.0.0",
  supportsAutoUpdate: true,
};
