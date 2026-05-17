import type { HostConfig } from "./types.ts";

export const cursorHost: HostConfig = {
  name: "Cursor",
  flag: "cursor",
  installPath: "~/.cursor/skills/ai-skills",
  contextHomeRelative: ".cursor/skills.json",
  contextFormat: "json",
  skillLoader: "skills-json",
  supportedSince: "1.0.0",
  supportsAutoUpdate: false,
};
