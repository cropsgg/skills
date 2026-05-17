#!/usr/bin/env bun
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { HOSTS, detectInstalledHosts, getHostByFlag } from "../src/hosts/index.ts";
import { installSkillLibrary } from "../src/lib/install.ts";
import { LIBRARY_SKILLS } from "../src/skills/manifest.ts";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

type Args = {
  help: boolean;
  team: boolean;
  prefix: boolean;
  autoUpgrade: boolean;
  host?: string;
};

function parseArgs(argv: string[]): Args {
  const out: Args = {
    help: false,
    team: false,
    prefix: false,
    autoUpgrade: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--team") out.team = true;
    else if (a === "--prefix") out.prefix = true;
    else if (a === "--no-prefix") out.prefix = false;
    else if (a === "--auto-upgrade") out.autoUpgrade = true;
    else if (a === "--host") {
      const v = argv[++i];
      if (!v || v.startsWith("--")) {
        console.error("error: --host requires a value (see docs/HOST_REFERENCE.md)");
        process.exit(1);
      }
      out.host = v;
    }
    else if (a.startsWith("--host=")) {
      const v = a.slice("--host=".length);
      if (!v) {
        console.error("error: --host= requires a value (see docs/HOST_REFERENCE.md)");
        process.exit(1);
      }
      out.host = v;
    }
  }
  return out;
}

function printUsage(): void {
  console.log(`Usage: ./setup [options]

Options:
  --host <name>   Install only for one host (see docs/HOST_REFERENCE.md)
  --team          Register session hooks for silent auto-update (where supported)
  --prefix        Namespaced slash commands (/ai-self-audit)
  --no-prefix     Short slash commands (/self-audit) — default
  --auto-upgrade  Re-run install from current checkout (same as a fresh setup)
  --help          Show this help
`);
}

export function main(argv: string[]): void {
  const args = parseArgs(argv);
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  let targets = HOSTS;
  if (args.host) {
    const h = getHostByFlag(args.host);
    if (!h) {
      console.error(`Unknown --host ${args.host}. See docs/HOST_REFERENCE.md`);
      process.exit(1);
    }
    targets = [h];
  } else {
    const detected = detectInstalledHosts();
    if (detected.length) targets = detected;
  }

  if (!targets.length) {
    console.error(
      "No hosts detected. Pass --host <name> from docs/HOST_REFERENCE.md",
    );
    process.exit(1);
  }

  if (args.autoUpgrade) {
    console.log("Re-installing from current checkout (--auto-upgrade).\n");
  }

  const useCopies = process.platform === "win32";
  if (useCopies) {
    console.log(
      "Windows detected: using file copies instead of symlinks. Re-run setup after git pull.",
    );
  }

  for (const host of targets) {
    try {
      installSkillLibrary(host, LIBRARY_SKILLS, {
        repoRoot,
        teamMode: args.team,
        prefix: args.prefix,
      });
    } catch (e) {
      console.error(
        e instanceof Error ? e.message : "Install failed for host " + host.flag,
      );
      process.exit(1);
    }
    const expanded = host.installPath.replace(/^~/, "~");
    console.log(
      `Installed ${LIBRARY_SKILLS.length} skills for host '${host.flag}' at ${expanded}`,
    );
  }

  if (args.team && process.platform === "win32") {
    console.log(
      "Note: POSIX session hooks are not installed on Windows; re-run ./setup on macOS/Linux, use WSL, or refresh after pulls.",
    );
  }

  console.log("");
  console.log("Next: restart your agent session, then run /self-audit to verify.");
}

main(process.argv.slice(2));
