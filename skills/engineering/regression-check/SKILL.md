---
name: regression-check
description: "Run and interpret tests to catch unintended side effects before merge or release."
---

## When To Use

- Before every commit on branches with CI, especially after refactors touching shared utilities.
- After dependency upgrades (direct or transitive) that affect compilation, runtime, or native addons.
- When tests were skipped, snapshots updated wholesale, or timeouts increased “to get green.”
- After merging parallel work that touched the same modules—silent conflict resolution errors happen.
- When behavior change is intended but coverage is missing for the newly introduced branches.

Related: `/self-audit` for code-path reasoning when tests are absent or misleading.

Do not use this skill for replacing dedicated threat modeling or performance measurement; it targets functional regression signals only.

## Core Stance

- Treat green CI as necessary, not sufficient—know what is *not* covered.
- Prefer failing loudly over silencing flakes with `.skip` without a tracked follow-up.
- Assume integration/e2e tests are telling you about environment coupling; read failures literally.
- Separate “tests fail” from “product broken”; both matter, but remedies differ.

## Research Backing

- **Evaluator–Optimizer patterns (OpenAI / Anthropic)** — iterative evaluation and correction loops improve reliability of complex outputs; apply the same discipline to automated changes verified by tests.
- **Community regression-checker skills** — widely adopted patterns for detecting unintended side effects across unit, integration, and e2e suites.

## Process

1. **Classify the change risk**
   - Low: localized function with existing tests.
   - Medium: refactors across modules, API surface edits, schema changes.
   - High: concurrency, auth, payments, migrations, distributed idempotency.
2. **Select the minimum sufficient test set**
   - Unit: `pnpm test`, `jest`, `vitest`, `pytest -q`, `go test ./...` (repo-specific).
   - Integration: services + database, queues, or HTTP fakes as the repo defines.
   - End-to-end: smoke paths for login, checkout, admin tasks—only what the change plausibly affects.
3. **Run tests the way CI does**
   - Match Node version, `CI=true`, parallelism, and env vars if known (`docker compose` services).
   - If local differs from CI, call that out as a verification gap.
4. **Analyze failures mechanically**
   - Capture the first failing stack trace; identify whether failure is assertion, timeout, crash, or infra.
   - Check for ordering dependence, real-time assumptions, shared mutable state, and random seeds.
5. **Audit coverage holes introduced by the change**
   - New branches without tests: list them as regression risks even if current tests pass.
6. **Define follow-ups**
   - For flakes: stabilization (deterministic clocks, isolated tmp dirs) or quarantine with an owner—not silent skips.

## Operating Rules

- Be precise, technical, and critical.
- Do not skip complex areas because they are hard to verify; run the suite or document why you cannot.
- Prefer evidence from code paths and validation output over intuition.
- Never recommend “just update snapshots” without reviewing each diff chunk for semantic validity.
- If e2e is red due to infra, separate infra failures from application failures in the report.
- Quantify confidence: what scenarios were executed, and what scenarios were explicitly *not* executed.

## Output Format

Return a markdown report with these exact sections:

- Change Risk Classification
- Commands Executed (and environment notes)
- Results Summary (pass/fail + duration if available)
- Failures (one subsection per failure: stack, root cause hypothesis, fix)
- Risky Changes Without Coverage
- Flake Suspicions and Stabilization Plan
- Required Follow-ups Before Merge

## Example

### Commands Executed

- `CI=1 pnpm test` (workspace root)
- `pnpm -C apps/web test:e2e --grep @checkout`

### Failures

- **`CheckoutE2E › applies discount`** — timeout waiting for `#order-total`.
  - **Hypothesis:** async price recompute slower after caching change; selector stable but data arrives late.
  - **Fix:** await network idle `waitForReactQuery()` helper; avoid arbitrary sleeps.

### Required Follow-ups

- Add unit test for discount math in `packages/pricing/src/discounts.ts` (currently only covered indirectly).
