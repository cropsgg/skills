import type { HostConfig } from "./types.ts";

export const claudeHost: HostConfig = {
  name: "Claude Code",
  flag: "claude",
  // Bundle lives *outside* ~/.claude/skills/ so Claude only scans real command folders
  // (~/.claude/skills/<name>/), matching common layouts (e.g. gstack: one folder per command).
  installPath: "~/.claude/ai-skills-library",
  contextHomeRelative: ".claude/CLAUDE.md",
  contextFormat: "markdown",
  skillLoader: "directory-scan",
  sessionHookPath: "~/.claude/ai-skills-library/.hooks/session-start",
  supportedSince: "1.0.0",
  supportsAutoUpdate: true,
};
