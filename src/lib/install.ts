import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { HostConfig } from "../hosts/types.ts";
import type { SkillManifestEntry } from "../skills/manifest.ts";
import { injectContext, expandHome, writeHostManifestJson } from "./context-inject.ts";
import { registerAutoUpdate } from "./auto-update.ts";

export interface InstallOptions {
  teamMode?: boolean;
  prefix?: boolean;
  repoRoot: string;
}

function removeDest(destSkills: string): void {
  if (!existsSync(destSkills)) return;
  try {
    const st = lstatSync(destSkills);
    if (st.isSymbolicLink()) {
      rmSync(destSkills);
      return;
    }
  } catch {
    /* fall through */
  }
  rmSync(destSkills, { recursive: true, force: true });
}

function linkOrCopySkills(srcSkills: string, destSkills: string, useCopies: boolean): void {
  removeDest(destSkills);
  if (useCopies) {
    cpSync(srcSkills, destSkills, { recursive: true });
    return;
  }
  symlinkSync(srcSkills, destSkills, "dir");
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
  mkdirSync(installRoot, { recursive: true });

  const srcSkills = join(opts.repoRoot, "skills");
  if (!existsSync(srcSkills)) {
    throw new Error(
      `Missing skills directory at ${srcSkills}. Run setup from the repository root.`,
    );
  }
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
