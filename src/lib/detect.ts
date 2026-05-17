import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import type { HostConfig } from "../hosts/types.ts";

function commandExists(cmd: string): boolean {
  try {
    if (process.platform === "win32") {
      execSync(`where ${cmd}`, { stdio: "ignore", shell: "cmd.exe" });
    } else {
      execSync(`command -v ${cmd}`, { stdio: "ignore" });
    }
    return true;
  } catch {
    return false;
  }
}

function homePath(rel: string): string {
  return join(homedir(), rel);
}

export function detectInstalledHosts(hosts: HostConfig[]): HostConfig[] {
  const found = new Set<string>();

  for (const h of hosts) {
    let ok = false;
    switch (h.flag) {
      case "claude":
        ok = commandExists("claude") || existsSync(homePath(".claude"));
        break;
      case "cursor":
        ok = commandExists("cursor") || existsSync(homePath(".cursor"));
        break;
      case "codex":
        ok = commandExists("codex") || existsSync(homePath(".codex"));
        break;
      case "opencode":
        ok = existsSync(homePath(".config/opencode"));
        break;
      case "factory":
        ok = existsSync(homePath(".factory"));
        break;
      case "kiro":
        ok = existsSync(homePath(".kiro"));
        break;
      case "hermes":
        ok = existsSync(homePath(".hermes"));
        break;
      case "gbrain":
        ok = existsSync(homePath(".gbrain"));
        break;
      default:
        ok = false;
    }
    if (ok) found.add(h.flag);
  }

  return hosts.filter((h) => found.has(h.flag));
}
