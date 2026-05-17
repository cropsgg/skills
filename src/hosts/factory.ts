import type { HostConfig } from "./types.ts";

export const factoryHost: HostConfig = {
  name: "Factory Droid",
  flag: "factory",
  installPath: "~/.factory/skills/ai-skills",
  contextHomeRelative: ".factory/FACTORY.md",
  contextFormat: "markdown",
  skillLoader: "directory-scan",
  sessionHookPath: "~/.factory/skills/ai-skills/.hooks/session-start",
  supportedSince: "1.0.0",
  supportsAutoUpdate: true,
};
