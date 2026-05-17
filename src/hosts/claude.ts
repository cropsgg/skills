import type { HostConfig } from "./types.ts";

export const claudeHost: HostConfig = {
  name: "Claude Code",
  flag: "claude",
  installPath: "~/.claude/skills/ai-skills",
  contextHomeRelative: ".claude/CLAUDE.md",
  contextFormat: "markdown",
  skillLoader: "directory-scan",
  sessionHookPath: "~/.claude/skills/ai-skills/.hooks/session-start",
  supportedSince: "1.0.0",
  supportsAutoUpdate: true,
};
