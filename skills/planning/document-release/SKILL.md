---
name: document-release
description: "Update all project docs to match shipped code; build a Diataxis coverage map showing which of the four quadrants (tutorials, how-tos, reference, explanation) have coverage and which are empty. Release-triggered documentation audit."
---

## When To Use

- Immediately after a release ships — as part of the release checklist.
- When the diff between the last release and current `main` is >500 lines or spans >5 files.
- When onboarding feedback repeats the same "undocumented prerequisite" or "outdated instructions."
- When README instructions diverge from scripts in `package.json`, `Makefile`, or `docker-compose.yml`.
- Before handing off a subsystem to another team or external integrators.

Related: `/docs-sync` for continuous documentation alignment (not release-triggered); `/document-generate` when quadrants are completely empty; `/self-audit` to verify doc claims against implementation paths; `/domain-context` for shared glossary and ADR alignment.

Do not use this skill for continuous doc alignment (use `/docs-sync`), for marketing copy or brand narrative, for speculative roadmap documents, or when no release has shipped (use `/docs-sync` for pre-release alignment).

## Core Stance

- Documentation is part of the release artifact, not an afterthought. Every release ships with a Diataxis coverage map.
- Wrong docs are not "nice to fix later" — they are bugs in the release that cause support tickets and onboarding failures.
- The Diataxis framework provides a coverage taxonomy: a project with only reference docs has no onboarding path; a project with only tutorials has no depth.
- Prefer one canonical source per fact. Link out instead of duplicating drift-prone blocks across multiple docs.
- Write for the next on-call engineer at 3am: explicit commands, expected outputs, and failure signatures.

## Research Backing

- **Procida (2017)**, *Diátaxis: A Systematic Framework for Technical Documentation* — four-mode documentation taxonomy: tutorials (learning-oriented), how-to guides (task-oriented), reference (information-oriented), explanation (understanding-oriented). Most projects have ref-only coverage.
- **Aghajani et al. (2019, IEEE/ACM MSR)**, *Software Documentation Issues Unveiled* — documentation drift and format inconsistency are leading causes of developer onboarding friction; unmaintained docs increase incident duration.
- **Google Technical Writing Courses** — audience-first documentation: write for the reader who needs the information, not the writer who already knows it. Each Diataxis quadrant serves a distinct audience need.

## Process

1. **Identify release scope**
   - Determine the diff since the last release: `git log <last-release-tag>..HEAD --oneline` or `git diff <last-release-tag>..HEAD --stat`.
   - Classify changes: new features, breaking changes, deprecations, bug fixes, config/env changes, dependency upgrades.

2. **Map affected docs to Diataxis quadrants**
   - Inventory all existing docs: `docs/`, `README.md`, `CONTRIBUTING.md`, `runbooks/`, `openapi.yaml` narrative sections, `ADRs/`.
   - For each doc, classify which Diataxis quadrant(s) it serves. A single doc can serve multiple quadrants.
   - Quadrants:
     - **Tutorials** — learning-oriented, step-by-step, assumes minimal prior knowledge, guides to basic competence.
     - **How-to guides** — task-oriented, assumes basic competence, solves a specific problem, can be read out of order.
     - **Reference** — information-oriented, describes the machinery, accurate and complete, can be consulted.
     - **Explanation** — understanding-oriented, explains why and how, provides background and context.

3. **Identify gaps**
   - **Fact gap:** a changed behavior is not documented in any quadrant (e.g., a new env var, a changed default, a deprecated flag).
   - **Quadrant gap:** an entire quadrant is empty for a subsystem that needs it (e.g., a new API endpoint has reference docs but no how-to guide for common use).
   - **Drift:** a documented claim no longer matches code behavior.

4. **Update drifted docs**
   - Trace each documented command to the script it claims to run; verify flags still exist.
   - Verify that code examples use current API routes, CLI names, and config keys.
   - Use `grep` or `rg` to find stale references to deprecated functions, flags, or endpoints.

5. **Build Diataxis coverage map**
   - Table: subsystem → tutorials coverage (✓/✗/partial) → how-to coverage → reference coverage → explanation coverage.
   - Heatmap: count of quadrants covered per subsystem (0–4).
   - Flag subsystems with 0–1 quadrants covered as critical documentation debt.

6. **Generate release notes doc section**
   - What changed in the docs for this release: added, updated, removed.
   - Include the Diataxis coverage map delta (what was empty that is now covered).
   - Link to each updated doc.

7. **Report** with coverage map, gap analysis, updated files list, and documentation debt items.

## Operating Rules

- Be precise, technical, and critical. "The docs are mostly right" is not a finding.
- Do not skip complex areas because they are hard to verify. Mark them as `[NEEDS OWNER CONFIRMATION]`.
- Prefer evidence from code paths and command output over intuition. Verify every claim against actual source.
- Never document secrets. Use placeholders and point to the secret manager workflow.
- If behavior is unstable (feature flag, gradual rollout), document **current** behavior and link to the issue/ticket.
- Treat screenshots as liabilities unless automated — prefer text and deterministic command output.
- A quadrant with a single, outdated doc is a gap, not coverage.

## Output Format

Return a markdown report with these exact sections:

- Release Scope (diff summary, change classification)
- Doc Inventory (files, quadrant classification)
- Diataxis Coverage Map (table: subsystem × 4 quadrants)
- Fact Gaps (changed behavior not in any doc)
- Quadrant Gaps (empty quadrants per subsystem)
- Drift Report (doc claim vs code reality, with file:line evidence)
- Updated Docs (files changed, summary of changes)
- Documentation Debt (ranked by user impact)
- Release Notes Doc Section (markdown ready to paste)
- Recommended Next Step

## Example

### Diataxis Coverage Map

| Subsystem | Tutorial | How-to | Reference | Explanation | Coverage |
|-----------|----------|--------|-----------|-------------|----------|
| Checkout API | ✗ | ✗ | ✓ (OpenAPI) | ✗ | 1/4 |
| Auth | ✓ (quickstart) | ✓ (login flow) | ✓ (token docs) | ✗ | 3/4 |
| Worker queue | ✗ | ✗ | ✗ | ✗ | 0/4 |
| Design system | ✓ (getting started) | ✓ (component usage) | ✓ (token ref) | ✓ (DESIGN.md) | 4/4 |

### Drift Report

- `README.md` claims `pnpm dev` starts API + worker; worker is now `pnpm dev:worker` per `package.json:scripts`.
- `docs/api/checkout.md` references `POST /api/v1/checkout` — actual route is `POST /api/checkout` per `src/routes/checkout.ts:12`.

### Documentation Debt

1. **Worker queue (0/4 quadrants)** — no docs exist. On-call cannot debug queue issues.
2. **Checkout API (1/4 quadrants)** — reference-only. No onboarding path for new checkout engineers.

### Recommended Next Step

Fix drifted README and API docs. Run `/document-generate` for worker queue subsystem (0/4 quadrants).
