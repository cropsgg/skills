---
name: write-a-skill
description: "Scaffold a new SKILL.md following the exact format contract, update all three registry files, and validate evidence and format compliance in one shot."
---

## When To Use

- Before creating any new skill in this repository.
- When a user says "create a skill for X" or "add a slash command that does Y."
- When porting a skill from another collection into this library.
- When a skill was rejected for format non-compliance and needs repair.
- When extending an existing skill's description requires registry updates to stay in sync.

Related: `/skills-doctor` diagnoses broken skills; `/reflect` identifies gaps a new skill could fill; `/session-handoff` if skill creation spans multiple sessions.

Do not use this skill for editing an existing skill's content (normal edit, not a scaffold). Do not use for non-SKILL markdown files like README or CONTRIBUTING.

## Core Stance

- The format contract is non-negotiable. Deviations break the multi-host installer and manifest ingestion. Every section must be present, in order, with exact heading names.
- Evidence is mandatory. Every new skill must cite at least one peer-reviewed study or authoritative industry standard. Unsourced assertions are rejected.
- Registry updates are part of the skill — a SKILL.md without registry entries is incomplete and undiscoverable to host agents.
- Progressive disclosure: the SKILL.md is the entry point; bundled resources (scripts, configs, templates) live in the same directory but are referenced by relative path, not inlined.
- Name discipline: kebab-case, verb-first for action skills (`land-and-deploy`), noun-first for review skills (`pr-review`). Match existing naming patterns.

## Research Backing

- **CONTRIBUTING.md (this repository)** — format contract with mandatory sections, evidence requirement, three-file registry update rule, and naming conventions.
- **Aghajani et al. (2019, IEEE/ACM MSR)**, *Software Documentation Issues Unveiled* — documentation format inconsistency is a leading cause of developer onboarding friction; standardized templates reduce defect injection during tool ingestion.
- **Google Technical Writing Courses** — structured templates with explicit section contracts improve documentation discoverability and reduce reviewer churn across distributed teams.

## Process

1. **Verify necessity**
   - Check `.cursor/skills.json` for duplicate names with `grep '"name"' .cursor/skills.json`.
   - Check `skills/productivity/`, `skills/engineering/`, `skills/planning/` for same-name directories.
   - If overlap exists: propose differentiation, composition with existing skill, or explicit replacement rationale before proceeding.

2. **Collect requirements**
   - Skill name in kebab-case (e.g., `my-new-skill`).
   - Domain: `productivity`, `engineering`, or `planning`.
   - Description: one sentence, ≤160 characters.
   - Tags: 2–5 lowercase kebab-case tags using the existing tag vocabulary where possible (`quality`, `testing`, `workflow`, `context`, `dx`, `safety`, `debugging`, `operations`, `documentation`).
   - At least one citation: peer-reviewed paper with authors, venue, year, and key finding OR authoritative industry standard (OWASP, W3C, OpenTelemetry, ISO).
   - Cross-references: at least one existing skill in this repo that the new skill composes with or relates to.

3. **Scaffold directory**
   - `mkdir -p skills/<domain>/<skill-name>/`
   - If bundled resources exist (scripts, templates, configs), create `skills/<domain>/<skill-name>/resources/` and reference them in Process steps by relative path.

4. **Draft the 8 mandatory sections** in exact order:
   - YAML frontmatter: `name` and `description` (use `>-` for multi-line descriptions).
   - `## When To Use` — bullet list of trigger conditions, then `Related:` line with backtick-wrapped `/skill-name` references, then `Do not use this skill for...` line specifying the alternative skill.
   - `## Core Stance` — 3–5 principles, declarative and opinionated. Staff-engineer tone: critical, precise, pragmatic. No assistant/servant language.
   - `## Research Backing` — bulleted list. Each entry: `**Author (Institution, Year)**, *Title.* Key finding.` Minimum 2 for engineering, 1 for productivity/planning.
   - `## Process` — numbered steps 1–N. Each step has a concrete command, file path, or tool invocation.
   - `## Operating Rules` — bulleted constraints. Use "Do not..." and "Prefer..." imperatives. No vague "be careful."
   - `## Output Format` — begins: `Return a markdown report with these exact sections:` followed by a bullet list of section names. Never "varies."
   - `## Example` — concrete, realistic snippets from each major output section. Real-looking file paths and values.

5. **Validate evidence**
   - Confirm every Research Backing bullet resolves to a real, identifiable source.
   - If uncertain about a citation: flag with `[VERIFY CITATION]` rather than inventing.
   - No invented authors, venues, years, or metrics.

6. **Update registries** (three files)
   - `.cursor/skills.json`: add entry with `name`, `description`, `file` (full path from repo root), `tags`.
   - `src/skills/manifest.ts`: verify auto-derivation from skills.json picks up the new entry. If the manifest uses `LIBRARY_SKILLS` or equivalent data source, confirm the path is in the correct array. Add manually only if the source of truth is not skills.json.
   - `README.md`: add a row to the appropriate inventory table (Engineering, Planning, Productivity) with columns matching the existing format.

7. **Validate format compliance**
   - Run the 8-item checklist against the drafted SKILL.md.
   - Use `cat skills/<domain>/<skill-name>/SKILL.md | head -1` to verify YAML frontmatter starts with `---`.
   - Use `grep -c "^## " skills/<domain>/<skill-name>/SKILL.md` to verify 7 level-2 headings (When To Use, Core Stance, Research Backing, Process, Operating Rules, Output Format, Example).

8. **Report**
   - Return the scaffold path, registry changes, and the format-compliance checklist with pass/fail status for each item.

## Operating Rules

- Never skip the "Do not use this skill for..." line — mandatory for downstream parsers and host manifest ingestion.
- Never create a SKILL.md with fewer than 8 sections. Missing sections cause silent install failures on some host agents.
- Evidence must be real and verifiable. If uncertain, flag `[VERIFY CITATION]` — never invent.
- Tags from the existing vocabulary only unless the new skill covers genuinely new territory.
- Description ≤160 characters for frontmatter. Use `>-` for multi-line, keeping the first line punchy.
- All three registries must be updated in the same commit. A SKILL.md without registry entries is orphaned and invisible to host agents.
- Directory name must match the skill name exactly (kebab-case). Path must be `skills/<domain>/<name>/SKILL.md`.

## Output Format

Return a markdown report with these exact sections:

- Skill Directory Created
- Domain / Name
- Description (≤160 chars)
- SKILL.md Sections Present (checklist, 8 items)
- Evidence Validation (citation verification with source confirmation)
- Registry Updates (3 files, with before/after snippets)
- Format Compliance (table: item, status)
- Next Steps (commit message suggestion)

## Example

### Skill Directory Created

`skills/productivity/my-new-skill/`

### SKILL.md Sections Present

| Section | Status |
|---------|--------|
| YAML frontmatter | OK |
| When To Use | OK |
| Core Stance | OK |
| Research Backing | OK |
| Process | OK |
| Operating Rules | OK |
| Output Format | OK |
| Example | OK |

### Registry Updates

`.cursor/skills.json` added:
```json
{
  "name": "my-new-skill",
  "description": "Brief one-sentence description of what this skill does.",
  "file": "skills/productivity/my-new-skill/SKILL.md",
  "tags": ["productivity", "workflow"]
}
```

### Format Compliance

| Item | Status |
|------|--------|
| YAML frontmatter (name + description) | PASS |
| When To Use with "Do not use" line | PASS |
| Related cross-references (≥1) | PASS |
| Research Backing (≥1 real citation) | PASS |
| Numbered Process with concrete steps | PASS |
| Specific Operating Rules | PASS |
| Rigid Output Format | PASS |
| Example with concrete content | PASS |
| Registry updates (3 files) | PASS |

### Next Steps

Suggested commit message:
```
feat(skills): add <name> skill

<one-line summary>

Co-authored-by: CommandCodeBot <noreply@commandcode.ai>
```
