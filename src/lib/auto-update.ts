import { mkdirSync, writeFileSync, lstatSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import type { HostConfig } from "../hosts/types.ts";
import { expandHome, chmodExecutable } from "./context-inject.ts";

export function registerAutoUpdate(host: HostConfig, repoRoot: string): void {
  if (!host.sessionHookPath || !host.supportsAutoUpdate) return;
  if (process.platform === "win32") return;

  const home = homedir();
  const hookPath = expandHome(host.sessionHookPath, home);
  mkdirSync(dirname(hookPath), { recursive: true });

  const flag = host.flag;
  const lib = repoRoot.replace(/'/g, "'\\''");
  const hookDir = dirname(hookPath).replace(/'/g, "'\\''");

  const body = `#!/bin/sh
STAMP_DIR='${hookDir}'
STAMP="$STAMP_DIR/.last-hook-${flag}"
NOW=$(date +%s 2>/dev/null || echo 0)
if [ -f "$STAMP" ]; then
  LAST=$(cat "$STAMP" 2>/dev/null || echo 0)
  if [ "$((NOW - LAST))" -lt 3600 ]; then exit 0; fi
fi
(cd '${lib}' && git pull --ff-only >/dev/null 2>&1 && (bun run bin/setup.ts -- --host '${flag}' 2>/dev/null || ./setup --host '${flag}' 2>/dev/null) >/dev/null 2>&1) || true
echo "$NOW" > "$STAMP" 2>/dev/null || true
`;

  writeFileSync(hookPath, body, "utf8");
  chmodExecutable(hookPath);
}

export function clearAutoUpdateHook(host: HostConfig): void {
  if (!host.sessionHookPath) return;
  const hookPath = expandHome(host.sessionHookPath, homedir());
  try {
    lstatSync(hookPath);
    rmSync(hookPath, { force: true });
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") {
      /* non-fatal */
    }
  }
}
