---
name: pre-commit-setup
description: "Scaffold Husky pre-commit hooks with lint-staged, format, typecheck, and tests."
---

## When To Use

- Repo lacks local commit gates but has lint/test scripts in `package.json`.
- After `/health-check` shows preventable failures reaching CI.
- New project wants fast feedback before push.

Related: `/regression-check` validates tests; `/health-check` measures baseline.

Do not use this skill for repos that already have equivalent hooks unless user wants migration or repair.

## Core Stance

- **Fast hooks win** — pre-commit should run seconds to low minutes, not full e2e.
- lint-staged: only touch staged files.
- Match existing formatter (Prettier, Biome) and linter (ESLint) — do not swap stack without ask.
- Hooks must be committable and documented in README snippet.

## Research Backing

- **Fowler (2006)**, *Continuous Integration* — fail fast on developer machine.
- **Google eng practices** — presubmit checks reduce review churn.
- **Husky documentation** — standard Git hooks integration for Node projects.

## Process

1. **Detect stack**
   - Node: `package.json` scripts; Python: `pre-commit` framework optional note
   - Prefer Bun if project uses Bun (`bun install`, `bun test`)
2. **Install Husky** (Node/Bun repos)
   - `bun add -d husky lint-staged` or npm equivalent per project
   - `bunx husky init`
3. **Configure lint-staged** in `package.json` or `.lintstagedrc`
   - `*.{ts,tsx,js}` → eslint --fix, prettier --write (or Biome equivalent)
   - Do **not** run `tsc --noEmit` per staged file — TypeScript needs project context. Run typecheck as a separate hook step instead.
4. **Pre-commit script**
   - lint-staged
   - Project typecheck script (`tsc --noEmit`, `bun run typecheck`, etc.) when it completes in under ~30s
   - Optional: fast unit test subset (`bun test <path>`) when under ~30s; move full suite to pre-push or CI
5. **Document** in README: how to skip in emergency (`HUSKY=0` with warning)
6. **Verify** with dummy staged file

## Operating Rules

- Do not add hooks that run full e2e suite on every commit unless user insists.
- Preserve existing hook chains — merge, do not overwrite blindly.
- Use project's package manager consistently.
- Minimal diff — only hook-related files unless user asks for ESLint setup too.

## Output Format

Return a markdown report with these exact sections:

- Stack Detected
- Files Created or Modified
- Hook Behavior Summary
- Commands to Verify Locally
- README Snippet Added (if any)
- Known Limitations

## Example

### Hook Behavior Summary

- Pre-commit: lint-staged (ESLint + Prettier on staged TS/TSX), then project typecheck when fast enough
- Pre-push: not configured (user can add separately)

### Commands to Verify Locally

```bash
git add .
git commit -m "test: verify hooks"
```
