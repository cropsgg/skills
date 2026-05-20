import type { HostConfig } from "./types.ts";

export const commandcodeHost: HostConfig = {
  name: "Command Code",
  flag: "commandcode",
  installPath: "~/.commandcode/skills/ai-skills",
  contextHomeRelative: ".commandcode/AGENTS.md",
  contextFormat: "markdown",
  skillLoader: "directory-scan",
  supportedSince: "1.0.0",
  supportsAutoUpdate: false,
};
