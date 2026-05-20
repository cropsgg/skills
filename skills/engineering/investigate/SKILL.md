---
name: investigate
description: "Systematic root-cause debugging with evidence before any fix is applied."
---

## When To Use

- When a bug reproduces intermittently or only in one environment (CI, staging, production).
- When stack traces point at symptoms, not causes (null access deep in UI, 500 with generic message).
- After three or more failed fix attempts — stop patching and investigate.
- When behavior changed without an obvious code diff (config, dependency, data drift, cache).
- When performance regressed and profiling data is missing or contradictory.

Related: `/regression-check` after a fix is identified; `/self-audit` for session-authored changes without a runtime repro.

Do not use this skill for greenfield feature design or pre-merge diff review without a failing behavior to explain.

## Core Stance

- **Iron law:** no fix without a verified root cause hypothesis supported by evidence.
- Reproduce first; theorize second; patch last.
- Treat every fix attempt as an experiment with a falsifiable prediction.
- Stop after three failed hypotheses and widen the investigation (data flow, env, timing).
- Prefer minimal instrumentation over large refactors during investigation.

## Research Backing

- **Google SRE — Postmortem Culture** — blameless analysis and timeline reconstruction reduce repeat incidents; root cause must be actionable, not “human error.”
- **Beyer et al. (Google, 2016)**, *Site Reliability Engineering* — systematic debugging via bisection, logging, and controlled experiments.
- **Agans (2002)**, *Debugging: The 9 Indispensable Rules* — systematic narrowing from symptom to root cause before changing code.

## Process

1. **Capture the failure contract**
   - Expected vs actual behavior in one sentence each.
   - Environment: OS, branch, commit, env vars, feature flags, dataset size.
   - Repro steps numbered; mark flaky vs deterministic.
2. **Reproduce minimally**
   - Smallest command, route, or test that fails (`curl`, unit test, browser path).
   - If not reproducible locally, pull CI logs, request IDs, and trace IDs.
3. **Map the data flow**
   - Trace inputs from entry (HTTP handler, event, CLI) to failure site.
   - List external dependencies: DB, cache, queue, third-party API.
   - Draw a simple sequence or note async boundaries.
4. **Form ranked hypotheses**
   - List 3–5 causes ordered by likelihood and cost to test.
   - Each hypothesis must be falsifiable in one step.
5. **Instrument and test**
   - Add temporary logs, breakpoints, or metrics — not permanent fixes yet.
   - Use git bisect if regression window is known.
   - Compare failing vs passing runs on the same inputs.
6. **Confirm root cause**
   - One sentence: “X happens because Y under condition Z.”
   - Cite file:line or log line as evidence.
7. **Fix and verify**
   - Smallest correct fix; run `/regression-check` scope.
   - Add a test that fails without the fix when practical.

## Operating Rules

- Do not ship speculative fixes “just in case.”
- Do not delete instrumentation until verification passes.
- Document dead ends — they prevent repeat work.
- If root cause is external (vendor, infra), state blast radius and mitigation separately from code fix.
- Quantify confidence: confirmed / likely / speculative.

## Output Format

Return a markdown report with these exact sections:

- Failure Contract (expected, actual, repro)
- Environment and Scope
- Data Flow Summary
- Hypotheses Tested (pass/fail per hypothesis)
- Root Cause (evidence-backed)
- Fix Applied (or recommended)
- Verification Performed
- Residual Risks and Follow-ups

## Example

### Root Cause

Checkout total shows `$0.00` because `applyDiscount()` runs before `priceLoaded` is true when the cache hits a stale cart snapshot (`packages/cart/src/checkout.ts:142`).

### Verification Performed

- Unit test added: `discount applies after price hydration`
- `CI=1 pnpm test packages/cart` — pass
