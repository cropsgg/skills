export type ContextFormat = "markdown" | "json" | "yaml";

export type SkillLoader = "directory-scan" | "manifest-json" | "skills-json";

export interface HostConfig {
  name: string;
  flag: string;
  installPath: string;
  /** Path fragment under user home, e.g. `.claude/CLAUDE.md` */
  contextHomeRelative: string;
  contextFormat: ContextFormat;
  skillLoader: SkillLoader;
  sessionHookPath?: string;
  supportedSince: string;
  supportsAutoUpdate: boolean;
}
