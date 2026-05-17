import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface SkillManifestEntry {
  name: string;
  description: string;
  file: string;
  tags: string[];
}

interface SkillsDocument {
  skills: SkillManifestEntry[];
  library: Record<string, unknown>;
}

function loadSkillsDocument(): SkillsDocument {
  const manifestDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = join(manifestDir, "..", "..");
  const path = join(repoRoot, ".cursor", "skills.json");
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw) as SkillsDocument;
}

const _doc = loadSkillsDocument();

/** Canonical list: single source of truth is `.cursor/skills.json`. */
export const LIBRARY_SKILLS: SkillManifestEntry[] = _doc.skills;

export function libraryMetadata(): Record<string, unknown> {
  return _doc.library;
}
