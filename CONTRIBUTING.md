# Contributing

Thank you for helping improve this skills library. The goal is **evidence-grounded** engineering guidance, not generic prompting advice. Prefer small, reviewable edits over large rewrites.

## Evidence requirement

Every new skill must cite **at least one** peer-reviewed study (identifiable venue and authors) **or** an authoritative industry standard (for example OWASP, W3C, OpenTelemetry). Unsourced “research,” invented metrics, or fake citations will not be merged.

## Skill format contract

All skills must follow the same `SKILL.md` structure: **YAML frontmatter** with at least `name` and `description`; then `## When To Use` (include a line beginning with `Do not use this skill for...`); `## Core Stance`; `## Research Backing`; numbered `## Process` with concrete commands and paths; `## Operating Rules`; rigid `## Output Format`; and `## Example`. Deviations break downstream expectations and the multi-host installer’s manifest expectations.

## Voice and hosting hygiene

Use a **staff-engineer neutral** tone (critical, precise, pragmatic). Avoid assistant-product marketing. For **Git commits and GitHub narration** (PR titles/bodies/comments), avoid naming proprietary IDEs if you want the repository to remain portable.

## Testing evidence

Before/after measurements are **preferred** but **not mandatory** for community submissions. Sweeping quantitative claims need citations or artifacts in the PR description.

## File layout and registry updates

Add skills at `skills/<domain>/<skill-name>/SKILL.md`. Update `.cursor/skills.json` (`name`, `description`, `file`, `tags` when applicable), `src/skills/manifest.ts`, and the inventory table in `README.md` in the same change. Duplicates without crisp differentiation may be rejected.

## Review expectations

Maintainers prioritize clarity, reproducibility, and honest sourcing. If you generalize a research result, point to the exact study or standard you mean—and do not add new authors, venues, or metrics that are not in the source.

When you rename or move a skill, update every registry reference in one pull request so installs do not break silently.

If you are unsure whether a source counts as peer-reviewed, ask in the pull request and default to a conservative standard (for example OWASP or W3C) rather than a vague blog post.
