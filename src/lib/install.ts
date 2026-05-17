import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { HostConfig } from "../hosts/types.ts";
import type { SkillManifestEntry } from "../skills/manifest.ts";
import { injectContext, expandHome, skillCommandName, writeHostManifestJson } from "./context-inject.ts";
import { registerAutoUpdate } from "./auto-update.ts";

export interface InstallOptions {
  teamMode?: boolean;
  prefix?: boolean;
  repoRoot: string;
}

/** Idempotent symlink or full tree copy of `skills/` into each host install root (all harnesses). */
function linkOrCopySkills(srcSkills: string, destSkills: string, useCopies: boolean): void {
  let srcReal: string;
  try {
    srcReal = realpathSync(srcSkills);
  } catch {
    throw new Error(`linkOrCopySkills: missing source directory ${srcSkills}`);
  }

  if (useCopies) {
    let st: ReturnType<typeof lstatSync> | undefined;
    try {
      st = lstatSync(destSkills);
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      if (err.code !== "ENOENT") {
        throw new Error(`linkOrCopySkills: could not stat ${destSkills}: ${err.message}`);
      }
    }
    if (st) {
      if (st.isSymbolicLink()) {
        unlinkSync(destSkills);
      } else {
        rmSync(destSkills, { recursive: true, force: true });
      }
    }
    try {
      cpSync(srcSkills, destSkills, { recursive: true });
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      if (err.code === "EEXIST") {
        rmSync(destSkills, { recursive: true, force: true });
        cpSync(srcSkills, destSkills, { recursive: true });
      } else {
        throw e;
      }
    }
    return;
  }

  let destSt: ReturnType<typeof lstatSync> | undefined;
  try {
    destSt = lstatSync(destSkills);
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") {
      throw new Error(`linkOrCopySkills: could not stat ${destSkills}: ${err.message}`);
    }
  }

  if (destSt) {
    if (destSt.isSymbolicLink()) {
      try {
        if (realpathSync(destSkills) === srcReal) {
          return;
        }
      } catch {
        /* broken symlink — replace */
      }
      unlinkSync(destSkills);
    } else {
      rmSync(destSkills, { recursive: true, force: true });
    }
  }

  try {
    symlinkSync(srcSkills, destSkills, "dir");
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "EEXIST") {
      try {
        if (lstatSync(destSkills).isSymbolicLink()) {
          unlinkSync(destSkills);
          symlinkSync(srcSkills, destSkills, "dir");
          return;
        }
      } catch {
        /* fall through */
      }
    }
    throw e;
  }
}

/**
 * Claude Code only registers `/skill-name` for immediate children of `~/.claude/skills/<skill-name>/SKILL.md`.
 * The repo-relative tree is mirrored under `~/.claude/ai-skills-library/skills/...`; we add per-command
 * symlinks (or copies on Windows) into `~/.claude/skills/` so slash commands resolve.
 */
function linkClaudeCodeSkillInvokers(
  home: string,
  resolvedFiles: { name: string; file: string }[],
  prefix: boolean,
  useCopies: boolean,
): void {
  const claudeSkillsRoot = join(home, ".claude", "skills");
  mkdirSync(claudeSkillsRoot, { recursive: true });

  for (const s of resolvedFiles) {
    const dirName = skillCommandName(s.name, prefix);
    const skillSourceDir = dirname(s.file);
    const destPath = join(claudeSkillsRoot, dirName);

    let sourceReal: string;
    try {
      sourceReal = realpathSync(skillSourceDir);
    } catch {
      console.warn(
        `Claude skills: missing skill directory for ~/.claude/skills/${dirName} (${skillSourceDir}); skipping.`,
      );
      continue;
    }

    let st: ReturnType<typeof lstatSync> | undefined;
    try {
      st = lstatSync(destPath);
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      if (err.code !== "ENOENT") {
        console.warn(
          `Claude skills: could not stat ~/.claude/skills/${dirName}: ${err.message}; skipping.`,
        );
        continue;
      }
    }

    if (st) {
      try {
        if (!useCopies && st.isSymbolicLink()) {
          try {
            if (realpathSync(destPath) === sourceReal) {
              continue;
            }
          } catch {
            /* broken symlink — replace */
          }
          unlinkSync(destPath);
        } else if (st.isDirectory() && !st.isSymbolicLink()) {
          const dstReal = realpathSync(destPath);
          if (dstReal === sourceReal) {
            rmSync(destPath, { recursive: true, force: true });
          } else {
            console.warn(
              `Claude skills: skip ~/.claude/skills/${dirName} — directory exists and is not managed by this installer.`,
            );
            continue;
          }
        } else {
          rmSync(destPath, { recursive: true, force: true });
        }
      } catch {
        console.warn(`Claude skills: could not replace ~/.claude/skills/${dirName}; skipping.`);
        continue;
      }
    }

    try {
      if (useCopies) {
        try {
          cpSync(skillSourceDir, destPath, { recursive: true });
        } catch (e) {
          const err = e as NodeJS.ErrnoException;
          if (err.code === "EEXIST") {
            rmSync(destPath, { recursive: true, force: true });
            cpSync(skillSourceDir, destPath, { recursive: true });
          } else {
            throw e;
          }
        }
      } else {
        try {
          symlinkSync(skillSourceDir, destPath, "dir");
        } catch (e) {
          const err = e as NodeJS.ErrnoException;
          if (err.code === "EEXIST") {
            try {
              if (lstatSync(destPath).isSymbolicLink()) {
                unlinkSync(destPath);
                symlinkSync(skillSourceDir, destPath, "dir");
              } else {
                throw e;
              }
            } catch (e2) {
              console.warn(
                `Claude skills: could not link ~/.claude/skills/${dirName}: ${e2 instanceof Error ? e2.message : String(e2)}`,
              );
            }
          } else {
            console.warn(
              `Claude skills: could not link ~/.claude/skills/${dirName}: ${err.message ?? String(e)}`,
            );
          }
        }
      }
    } catch (e) {
      console.warn(
        `Claude skills: could not link ~/.claude/skills/${dirName}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}

/** Older installers used `~/.claude/skills/ai-skills/` (nested `skills/...`), which breaks slash discovery. */
function migrateLegacyClaudeBundleHome(home: string, installRoot: string): void {
  const legacy = join(home, ".claude", "skills", "ai-skills");
  if (!existsSync(legacy)) return;
  try {
    if (!existsSync(installRoot)) {
      renameSync(legacy, installRoot);
      return;
    }
    rmSync(legacy, { recursive: true, force: true });
  } catch {
    try {
      rmSync(legacy, { recursive: true, force: true });
    } catch {
      /* user can remove manually */
    }
  }
}

function assertSkillSources(repoRoot: string, skills: SkillManifestEntry[]): void {
  for (const skill of skills) {
    if (!skill.file.startsWith("skills/") || !skill.file.endsWith("/SKILL.md")) {
      throw new Error(
        `Invalid manifest path for ${skill.name}: ${skill.file}. Expected skills/<category>/<name>/SKILL.md.`,
      );
    }
    const sourceFile = join(repoRoot, skill.file);
    if (!existsSync(sourceFile)) {
      throw new Error(
        `Missing SKILL.md for ${skill.name} at ${sourceFile}. Fix .cursor/skills.json before running setup.`,
      );
    }
  }
}

export function installSkillLibrary(
  host: HostConfig,
  skills: SkillManifestEntry[],
  opts: InstallOptions,
): { installRoot: string; contextPath: string } {
  const home = homedir();
  const useCopies = process.platform === "win32";
  if (useCopies) {
    // Required: one-line note (printed by caller)
  }

  const installRoot = expandHome(host.installPath, home);
  if (host.flag === "claude") {
    migrateLegacyClaudeBundleHome(home, installRoot);
  }
  mkdirSync(installRoot, { recursive: true });

  const srcSkills = join(opts.repoRoot, "skills");
  if (!existsSync(srcSkills)) {
    throw new Error(
      `Missing skills directory at ${srcSkills}. Run setup from the repository root.`,
    );
  }
  assertSkillSources(opts.repoRoot, skills);
  const destSkills = join(installRoot, "skills");
  linkOrCopySkills(srcSkills, destSkills, useCopies);

  const contextPath = join(home, host.contextHomeRelative);

  const resolvedFiles = skills.map((s) => ({
    ...s,
    file: join(installRoot, s.file),
  }));

  if (host.skillLoader === "manifest-json") {
    writeHostManifestJson(installRoot, resolvedFiles, Boolean(opts.prefix));
  }

  injectContext(host, resolvedFiles, contextPath, Boolean(opts.prefix));

  if (host.flag === "claude") {
    linkClaudeCodeSkillInvokers(home, resolvedFiles, Boolean(opts.prefix), useCopies);
  }

  if (host.flag === "cursor") {
    try {
      const templatePath = join(opts.repoRoot, ".cursor/skills.json");
      const template = JSON.parse(readFileSync(templatePath, "utf8")) as Record<
        string,
        unknown
      >;
      const user = JSON.parse(readFileSync(contextPath, "utf8")) as Record<
        string,
        unknown
      >;
      if (template.library) user.library = template.library;
      writeFileSync(contextPath, `${JSON.stringify(user, null, 2)}\n`, "utf8");
    } catch {
      /* keep injected JSON as-is */
    }
  }

  if (opts.teamMode && host.supportsAutoUpdate) {
    registerAutoUpdate(host, opts.repoRoot);
  }

  return { installRoot, contextPath };
}
