import { claudeHost } from "./claude.ts";
import { codexHost } from "./codex.ts";
import { commandcodeHost } from "./commandcode.ts";
import { cursorHost } from "./cursor.ts";
import { opencodeHost } from "./opencode.ts";
import { factoryHost } from "./factory.ts";
import { kiroHost } from "./kiro.ts";
import { hermesHost } from "./hermes.ts";
import { gbrainHost } from "./gbrain.ts";
import type { HostConfig } from "./types.ts";
import { detectInstalledHosts as detectHosts } from "../lib/detect.ts";

export const HOSTS: HostConfig[] = [
  claudeHost,
  codexHost,
  commandcodeHost,
  cursorHost,
  opencodeHost,
  factoryHost,
  kiroHost,
  hermesHost,
  gbrainHost,
];

export { type HostConfig } from "./types.ts";

export function getHostByFlag(flag: string): HostConfig | undefined {
  return HOSTS.find((h) => h.flag === flag);
}

export function detectInstalledHosts(hosts: HostConfig[] = HOSTS): HostConfig[] {
  return detectHosts(hosts);
}
