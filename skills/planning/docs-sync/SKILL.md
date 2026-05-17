---
name: docs-sync
description: "Align documentation, ADRs, and runbooks with implemented behavior to reduce knowledge decay."
---

## When To Use

- After shipping behavior changes that alter setup, configuration, API usage, failure modes, or SLAs.
- When onboarding feedback repeats the same “undocumented prerequisite” issues.
- When README instructions diverge from scripts in `package.json`, `Makefile`, `justfile`, or `docker-compose.yml`.
- When ADRs exist for old decisions but code paths have clearly shifted.
- Before handing off a subsystem to another team or external integrators.

Related: `/self-audit` to verify the documentation claims against the actual implementation paths.

Do not use this skill for marketing copy, brand narrative, or speculative roadmap documents unless explicitly requested.

## Core Stance

- Documentation is an interface; wrong docs are defects, not “nice to fix later.”
- Prefer one canonical source per fact; link out instead of duplicating drift-prone blocks.
- Write for the next on-call engineer at 3am: explicit commands, expected outputs, and failure signatures.
- Assume readers cannot infer missing context—especially environment variables and permissions.

## Research Backing

- **Documentation-driven development** — treat docs as part of the change contract: behavior is not “real” until integrators can follow verified instructions.
- **Knowledge decay in software maintenance** — systems evolve faster than mental models; unmaintained docs increase incident duration and defect injection during refactors.

## Process

1. **Identify audiences**
   - Contributor, operator, integrator, end-user; each needs different certainty and tone.
2. **Inventory facts that must be true**
   - Install prerequisites, required versions, env vars, migration order, queue/topic names, feature flags, dashboards, alert routes.
3. **Diff docs against code**
   - Trace each documented command to the script it claims to run; verify flags still exist.
   - Check that examples use current API routes, CLI names, and config keys (`grep`/`ripgrep` helps).
4. **Update structured artifacts**
   - `README.md`, `docs/**`, `CONTRIBUTING.md`, `openapi.yaml` narrative sections, runbooks in `runbooks/**` or `docs/oncall/**`.
5. **Cross-link and de-duplicate**
   - Replace copy-pasted snippets with links to canonical pages; keep one maintenance surface.
6. **Add verification hooks**
   - Encourage doc-tests or scripted checks where feasible (command blocks executed in CI, `markdownlint` + link checkers).

## Operating Rules

- Be precise, technical, and critical.
- Do not skip complex areas because they are hard to verify; mark them as “needs owner confirmation.”
- Prefer evidence from code paths and validation output over intuition.
- Never document secrets; use placeholders and point to secret manager workflow.
- If behavior is unstable, document **current** behavior and link to issue/ticket for intended behavior—do not invent futures.
- Treat screenshots as liabilities unless you can keep them updated—prefer text and deterministic outputs.

## Output Format

Return a markdown report with these exact sections:

- Audience Map
- Doc Inventory (files touched / should touch)
- Drift Report (doc claim vs code reality)
- Doc Debt (missing sections, outdated diagrams)
- Required Updates (ranked)
- Ownership Suggestions (who should maintain each doc)
- Verification Plan (link checks, executable blocks, review checklist)

## Example

### Drift Report

- `README.md` claims `pnpm dev` starts API + worker; worker is now `pnpm dev:worker` per `package.json`.

### Required Updates

- Update quickstart; add troubleshooting for common port collisions; link to `docs/architecture/workers.md`.

### Verification Plan

- Run `pnpm -w lint:docs`; enable CI link checker; add copy-pasteable `curl` example validated against staging OpenAPI.

### Ownership Suggestions

- **Quickstart + local dev:** web platform team (owns `package.json` scripts).
- **Worker topology:** backend infra team (owns compose + queue docs).
