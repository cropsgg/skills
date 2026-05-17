import { mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { dirname, join } from "node:path";
import type { HostConfig } from "../hosts/types.ts";

const SECTION_HEADER = "## AI Skills Library";

export function expandHome(pathWithTilde: string, home: string): string {
  if (pathWithTilde.startsWith("~/")) return join(home, pathWithTilde.slice(2));
  if (pathWithTilde === "~") return home;
  return pathWithTilde;
}

/** Slash command / folder basename for a skill (used by Claude Code discovery). */
export function skillCommandName(base: string, prefix: boolean): string {
  return prefix ? `ai-${base}` : base;
}

function buildMarkdownSection(
  skills: { name: string; description: string; file: string }[],
  prefix: boolean,
): string {
  const lines = [
    SECTION_HEADER,
    "",
    "Use these skills for production engineering work in this environment.",
    "",
    "When a slash command is invoked, read the matching `SKILL.md` file below and follow it before acting.",
    "",
    "Slash commands:",
    "",
  ];
  for (const s of skills) {
    const n = skillCommandName(s.name, prefix);
    lines.push(`- \`/${n}\` — ${s.description} File: \`${s.file}\``);
  }
  const sa = skillCommandName("self-audit", prefix);
  const rc = skillCommandName("regression-check", prefix);
  const sec = skillCommandName("security-audit", prefix);
  lines.push(
    "",
    `**Cadence:** run \`/${sa}\` after substantive implementation; \`/${rc}\` before commits when tests exist; \`/${sec}\` before high-risk merges.`,
  );
  return lines.join("\n");
}

function stripLegacySection(content: string): string {
  const start = content.indexOf(SECTION_HEADER);
  if (start === -1) return content.trimEnd();
  const rest = content.slice(start + SECTION_HEADER.length);
  const next = rest.search(/\n## /);
  if (next === -1) return content.slice(0, start).trimEnd();
  const end = start + SECTION_HEADER.length + next;
  return (content.slice(0, start) + content.slice(end)).trimEnd();
}

export function injectContext(
  host: HostConfig,
  skills: { name: string; description: string; file: string; tags?: string[] }[],
  contextPath: string,
  prefix: boolean,
): void {
  mkdirSync(dirname(contextPath), { recursive: true });

  if (host.contextFormat === "markdown") {
    let existing = "";
    try {
      existing = readFileSync(contextPath, "utf8");
    } catch {
      existing = "";
    }
    const base = stripLegacySection(existing);
    const section = buildMarkdownSection(skills, prefix);
    const spacer = base.length ? (base.endsWith("\n\n") ? "" : "\n\n") : "";
    const out = `${base}${spacer}${section}\n`;
    writeFileSync(contextPath, out, "utf8");
    return;
  }

  if (host.contextFormat === "json") {
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(readFileSync(contextPath, "utf8")) as Record<string, unknown>;
    } catch {
      data = {};
    }
    const nextSkills = skills.map((s) => ({
      name: skillCommandName(s.name, prefix),
      description: s.description,
      file: s.file,
      ...(s.tags ? { tags: s.tags } : {}),
    }));
    const managedNames = new Set<string>();
    for (const s of skills) {
      managedNames.add(skillCommandName(s.name, false));
      managedNames.add(skillCommandName(s.name, true));
    }
    const existingSkills = Array.isArray(data.skills) ? data.skills : [];
    const merged = new Map<string, (typeof nextSkills)[0]>();
    for (const e of existingSkills as typeof nextSkills) {
      if (e?.name && !managedNames.has(e.name)) merged.set(e.name, e);
    }
    for (const e of nextSkills) merged.set(e.name, e);
    data.skills = [...merged.values()];
    writeFileSync(contextPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    return;
  }

  if (host.contextFormat === "yaml") {
    let existing = "";
    try {
      existing = readFileSync(contextPath, "utf8");
    } catch {
      existing = "";
    }
    const base = stripLegacySection(existing);
    const lines: string[] = [
      SECTION_HEADER,
      "",
      "skills:",
      ...skills.map((s) => {
        const n = skillCommandName(s.name, prefix);
        return `  - name: ${n}\n    description: ${JSON.stringify(s.description)}`;
      }),
    ];
    const spacer = base.length ? (base.endsWith("\n\n") ? "" : "\n\n") : "";
    writeFileSync(contextPath, `${base}${spacer}${lines.join("\n")}\n`, "utf8");
  }
}

export function writeHostManifestJson(
  installRoot: string,
  skills: { name: string; description: string; file: string; tags?: string[] }[],
  prefix: boolean,
): void {
  const target = join(installRoot, "skills-manifest.json");
  const payload = {
    skills: skills.map((s) => ({
      name: skillCommandName(s.name, prefix),
      description: s.description,
      // Callers pass absolute paths already (see installSkillLibrary).
      file: s.file,
      ...(s.tags ? { tags: s.tags } : {}),
    })),
  };
  writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export function chmodExecutable(path: string): void {
  try {
    chmodSync(path, 0o755);
  } catch {
    /* ignore */
  }
}
