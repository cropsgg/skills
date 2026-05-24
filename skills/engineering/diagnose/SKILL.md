---
name: diagnose
description: "Disciplined 6-step diagnosis loop with strict evidence gates between stages. Reproduce → minimise → hypothesise → instrument → fix → regression-test. Cannot advance without the required artifact per step."
---

## When To Use

- When a failure is reproducible and you need a disciplined, evidence-gated loop — not a freeform investigation.
- When previous "fix then see" attempts have wasted cycles and the team needs structured diagnostic rigor.
- When the failure mode is narrow and isolated enough to iterate through all six stages in a single session.
- When pairing with engineers who need the loop discipline enforced by gate checks that can't be skipped.

Related: `/investigate` when the failure source is unclear, the bug cannot yet be reproduced, or root cause spans multiple systems — diagnose needs a confirmed repro to start; `/regression-check` for the final verification step; `/self-audit` when a diagnosis session introduced code changes that must be reviewed independently.

Do not use this skill when you cannot yet reproduce the failure or when the blast radius is unknown — start with `/investigate` to narrow the search space first. Do not use for multi-cause failures (run one loop per cause).

## Core Stance

- Gate discipline is non-negotiable. You may not advance from step N to N+1 without producing the required evidence artifact for step N.
- Reproduce before hypothesise; instrument before fix; regression-test before close. The order exists for a reason.
- Each hypothesis must be falsifiable by a single instrumented observation — if you need three experiments, the hypothesis is not specific enough.
- Minimising is not optional. A minimal reproducer is the single highest-leverage artifact in the entire diagnosis loop.
- The loop is designed to be restartable. If regression-test fails, return to step 2 (minimise the fix failure) — not step 1.

## Research Backing

- **Agans (2002)**, *Debugging: The 9 Indispensable Rules for Finding Even the Most Elusive Software and Hardware Problems* — systematic narrowing from symptom to root cause; the "make it fail" rule as prerequisite before any fix attempt; the "understand the system" rule before hypothesizing.
- **Zeller (2009)**, *Why Programs Fail: A Guide to Systematic Debugging* — delta debugging as a formal method for minimal reproducer construction; the hypothesis–experiment–conclusion cycle as the scientific method applied to debugging.
- **Beyer et al. (Google, 2016)**, *Site Reliability Engineering*, Chapter 12 — "Understand the problem before you try to solve it. Reproduce. Narrow. Confirm." The SRE approach to systematic debugging with evidence requirements.

## Process

1. **Reproduce**
   - Capture the failure with a single command or minimal interaction sequence.
   - Record: exact input, environment (OS, runtime version, env vars), expected vs actual output.
   - Artifact: a copy-pasteable reproducer command or script.
   - **Gate:** the reproducer must produce the failure on two consecutive attempts before advancing. One success could be luck.

2. **Minimise**
   - Remove inputs, config, data, and code paths not required for the failure.
   - Technique: binary search on inputs — remove half, check if failure persists; if yes, the removed half is irrelevant.
   - For flaky failures: run the reproducer 10× and record failure rate as baseline.
   - Artifact: a minimal reproducer — the smallest input set and code path that still triggers the failure.
   - **Gate:** when any removed element, if restored alone, does not reintroduce the failure — it was truly irrelevant.

3. **Hypothesise**
   - Propose exactly one root-cause hypothesis per iteration. Multi-hypothesis loops lose traceability.
   - Format: "X causes Y because Z" with a falsifiable prediction: "If X is true, then we will observe W."
   - Rank by prior probability (has this class of bug occurred before?) and cost to test.
   - Artifact: written hypothesis with predicted observable effect if true.
   - **Gate:** hypothesis must be falsifiable by a single instrumented observation. If it requires multiple experiments, decompose further.

4. **Instrument**
   - Add the minimum instrumentation to test the hypothesis: a log line, a breakpoint, a counter, a conditional assertion.
   - Use `console.trace`, `debugger`, `strace`, `pprof.Do`, or language-appropriate probes.
   - Never commit instrumentation at this step — it is temporary diagnostic code.
   - Artifact: the instrumentation output.
   - **Gate:** instrumentation output must unambiguously confirm or refute the hypothesis. "Maybe" or "sort of" means the hypothesis needs refinement.

5. **Fix**
   - Apply the smallest correct fix for the confirmed root cause. No opportunistic refactors.
   - The fix must be reversible (one commit, one concern).
   - Add a test that fails without the fix and passes with it.
   - Artifact: the fix diff and the new test.
   - **Gate:** the new test must fail when the fix is reverted and pass when it's applied. Prove the test catches the bug.

6. **Regression-test**
   - Run the full `/regression-check` scope for the affected module.
   - Run the original reproducer from step 1 — it must now pass.
   - Run the minimal reproducer from step 2 — it must now pass.
   - **Gate:** all three checks pass before declaring the loop closed.
   - If any regression check fails: restart from step 2 with the new failure as input. Do not restart from step 1.

## Operating Rules

- Do not skip a step or advance without its gate artifact. If stuck at a gate, widen the search with `/investigate` instead.
- Do not fix a hypothesis that has not been confirmed by instrumentation. "Probably it" is not evidence.
- Do not leave instrumentation in place after the loop closes. Remove it or promote it to permanent observability in a separate commit.
- If three sequential hypotheses are refuted, stop and escalate: the root cause may be external.
- Document each loop iteration. Iteration history prevents repeat work and provides the audit trail.
- One cause per diagnose loop. If multiple independent causes are suspected, run sequential loops.

## Output Format

Return a markdown report with these exact sections:

- Failure Summary (expected, actual, environment)
- Step 1 — Reproduce (reproducer command, output excerpt, gate status)
- Step 2 — Minimise (minimal reproducer, what was removed, gate status)
- Step 3 — Hypothesis (statement, predicted observation, gate status)
- Step 4 — Instrumentation (what was added, observed result, gate status)
- Step 5 — Fix Applied (diff summary, test added, gate status)
- Step 6 — Regression Test Results (commands run, pass/fail, gate status)
- Loop Iterations (table: iteration, hypothesis, result, decision)
- Residual Risk

## Example

### Step 1 — Reproduce

```bash
curl -s http://localhost:3000/api/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"cartId":"cart_abc","coupon":"SAVE10"}'
# Expected: {"total":9000,"discount":1000}
# Actual:   {"total":10000,"discount":0}
```
Reproduced 2/2 attempts. **Gate: PASS**

### Step 2 — Minimise

Removed: coupon code, auth token (works with empty cart), async price recalculation, product catalog query. Failure persists with `POST /api/checkout {"cartId":"cart_abc"}` — discount field always 0. Restoring any removed element alone does not change the failure. **Gate: PASS**

### Step 3 — Hypothesis

**H1:** `applyDiscount()` runs before `priceLoaded` resolves to `true` because the cart cache returns a stale snapshot where `priceLoaded` is still `false`. Prediction: logging `priceLoaded` at `applyDiscount()` entry will show `false` on failing requests. **Gate: PASS** (falsifiable in one observation)

### Step 4 — Instrumentation

Added `console.log("priceLoaded:", priceLoaded)` at `packages/cart/src/checkout.ts:140`. Observation: `priceLoaded: false` on every failing request, `priceLoaded: true` when cache is bypassed. **H1 confirmed. Gate: PASS**

### Step 5 — Fix Applied

```diff
// packages/cart/src/checkout.ts:142
- if (cartSnapshot) return applyDiscount(cartSnapshot);
+ if (cartSnapshot && cartSnapshot.priceLoaded) return applyDiscount(cartSnapshot);
```
Test added: `discount waits for price hydration` in `packages/cart/src/checkout.test.ts`. Reverting the fix: test fails. Applying fix: test passes. **Gate: PASS**

### Step 6 — Regression Test Results

- `pnpm test packages/cart` — 47 pass, 0 fail
- Repro curl — `{"total":9000,"discount":1000}` ✓
- Minimal repro — ✓
**Gate: PASS**

### Residual Risk

Cache invalidation on cart update may still race. Mitigated by the `priceLoaded` guard. Monitor `cart_stale_snapshot` metric for 1 week.
