---
name: health-check
description: "Composite code quality score from linter, types, tests, and optional dead-code checks."
---

## When To Use

- Weekly or pre-sprint baseline of repo health.
- After large merges or dependency upgrades.
- When the user asks "how healthy is the codebase?" or "run all checks."
- Before `/retro` to attach metrics to trends.

Related: `/regression-check` for deep test interpretation; `/dependency-audit` for supply chain.

Do not use this skill for security review or production monitoring substitution.

## Core Stance

- Wrap **existing project tools** — do not invent custom linters.
- Score is weighted composite 0–10 with transparent breakdown.
- A failing gate is reported honestly — do not inflate scores.
- Track commands run and duration for reproducibility.

## Research Backing

- **Fowler (2006)**, *Continuous Integration* — automated quality gates on every change.
- **Beyer et al. (Google, 2016)**, *Site Reliability Engineering* — measurable operational readiness.
- **ISO/IEC 25010** — software quality model (maintainability, reliability characteristics).

## Process

1. **Discover toolchain**
   - `package.json` scripts, Makefile, CI config, `pyproject.toml`, etc.
2. **Run checks** (when present)
   - Typecheck / compile
   - Linter
   - Unit tests (full or `--changed` if time-bound)
   - Optional: dead code (`knip`, `ts-prune`), shell lint
3. **Score each dimension** (0–10)
   - Types: pass=10, errors scale down
   - Lint: pass=10, warn/error counts reduce
   - Tests: pass rate and count
   - Build: success/fail
4. **Weighted composite**
   - Default weights: tests 40%, types 25%, lint 20%, build 15%.
   - If a dimension has no tool, exclude it and **renormalize** remaining weights to sum to 100%; note excluded dimensions explicitly.
5. **Trend note**
   - Compare to previous run if user provides prior score; else mark "baseline."

## Operating Rules

- Run commands from repo root; note missing tools explicitly.
- Do not fix failures unless user requests — report only in this skill.
- Prefer same env as CI when documented (`CI=true`).
- Bun projects: use `bun test`, `bun run` per workspace rules.

## Output Format

Return a markdown report with these exact sections:

- Toolchain Detected
- Commands Executed (with exit codes and duration)
- Dimension Scores (table: dimension, score, evidence)
- Composite Score (0–10)
- Top Failures (blocking)
- Recommended Fixes (priority order)
- Trend (baseline / delta if known)

## Example

### Dimension Scores

| Dimension | Score | Evidence |
|-----------|-------|----------|
| Tests | 8/10 | 142/145 pass, 3 flaky skipped |
| Types | 10/10 | `tsc --noEmit` clean |
| Lint | 7/10 | 12 warnings |

### Composite Score

**8.2 / 10**
