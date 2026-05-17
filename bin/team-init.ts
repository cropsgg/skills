#!/usr/bin/env bun
import {
  appendFileSync,
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { execSync, execFileSync } from "node:child_process";

function isGitRepo(dir: string): boolean {
  return existsSync(join(dir, ".git"));
}

function ensureGitignore(gitignorePath: string, line: string): void {
  let body = "";
  try {
    body = readFileSync(gitignorePath, "utf8");
  } catch {
    body = "";
  }
  if (!body) {
    writeFileSync(gitignorePath, `${line}\n`, "utf8");
    return;
  }
  if (!body.split("\n").includes(line.trim())) {
    appendFileSync(gitignorePath, `\n${line}\n`, "utf8");
  }
}

function gitAddPaths(cwd: string, paths: string[]): void {
  const existing = paths.filter((p) => existsSync(join(cwd, p)));
  if (!existing.length) return;
  execFileSync("git", ["add", "--", ...existing], {
    cwd,
    stdio: "inherit",
  });
}

export function main(argv: string[]): void {
  const mode = argv[0];
  if (mode !== "required" && mode !== "optional") {
    console.error("Usage: team-init <required|optional>");
    process.exit(1);
  }

  const cwd = process.cwd();
  if (!isGitRepo(cwd)) {
    console.error("Not a git repository");
    process.exit(1);
  }

  const home = homedir();
  const globalLib = join(home, ".ai-skills");
  const linkName = join(cwd, ".ai-skills");

  if (!existsSync(globalLib)) {
    if (mode === "optional") {
      console.log(
        `Optional mode: library not found at ${globalLib}; skipping link.`,
      );
      process.exit(0);
    }
    console.error(`Expected library at ${globalLib}. Clone your skills repository there first.`);
    process.exit(1);
  }

  try {
    if (process.platform === "win32") {
      writeFileSync(
        join(cwd, ".ai-skills-path.txt"),
        `${globalLib}\n`,
        "utf8",
      );
    } else {
      let destStat: ReturnType<typeof lstatSync> | undefined;
      try {
        destStat = lstatSync(linkName);
      } catch (e) {
        const err = e as NodeJS.ErrnoException;
        if (err.code !== "ENOENT") {
          throw e;
        }
      }

      if (!destStat) {
        symlinkSync(globalLib, linkName, "dir");
      } else if (destStat.isSymbolicLink()) {
        try {
          if (realpathSync(linkName) !== realpathSync(globalLib)) {
            unlinkSync(linkName);
            symlinkSync(globalLib, linkName, "dir");
          }
        } catch {
          try {
            unlinkSync(linkName);
          } catch {
            /* ignore */
          }
          symlinkSync(globalLib, linkName, "dir");
        }
      }
    }
  } catch (e) {
    if (mode === "required") {
      console.error(
        e instanceof Error ? e.message : "Failed to create .ai-skills link",
      );
      process.exit(1);
    }
    console.error("team-init optional: could not link .ai-skills (non-fatal)");
    process.exit(0);
  }

  ensureGitignore(join(cwd, ".gitignore"), ".ai-skills-path.txt");

  const toStage = [".ai-skills", ".ai-skills-path.txt", ".gitignore"].filter(
    (p) => existsSync(join(cwd, p)),
  );

  try {
    gitAddPaths(cwd, toStage);
    execSync(
      'git commit -m "Add AI Skills Library for team-wide agent assistance"',
      { cwd, stdio: "inherit" },
    );
  } catch {
    console.log("Nothing to commit or commit failed (check git status).");
  }

  console.log("team-init complete.");
  if (mode === "optional") {
    console.log(
      "optional mode: missing shared library should not block contributors.",
    );
  }
}

main(process.argv.slice(2));
