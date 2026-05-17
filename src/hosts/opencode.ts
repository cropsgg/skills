import type { HostConfig } from "./types.ts";

export const opencodeHost: HostConfig = {
  name: "OpenCode",
  flag: "opencode",
  installPath: "~/.config/opencode/skills/ai-skills",
  contextHomeRelative: ".config/opencode/AGENTS.md",
  contextFormat: "markdown",
  skillLoader: "manifest-json",
  supportedSince: "1.0.0",
  supportsAutoUpdate: false,
};
