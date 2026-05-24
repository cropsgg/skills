---
name: karpathy-rules
description: "Encode Andrej Karpathy's four LLM coding failure modes as enforceable audit gates: (1) Hallucinated APIs, (2) Over-engineered solutions, (3) Missing error handling, (4) Unverified assumptions. Every code block must pass all four gates."
---

## When To Use

- Before emitting any code block to the user or writing it to disk.
- After generating a non-trivial implementation — run all four gates before declaring it ready.
- When the agent has been generating code rapidly and may be drifting into autopilot mode.
- As a lightweight pre-commit self-audit that's faster than `/second-opinion` or `/pr-review`.
- When working in an unfamiliar library or framework where hallucinated APIs are likely.

Related: `/chain-of-verification` for Gate 4 (assumptions) enforcement; `/adversarial-self-test` for security-focused self-audit; `/self-audit` for session-level change review; `/evaluator-optimizer-loop` for scoring and iterating on output quality.

Do not use this skill for non-code output (docs, plans, conversation). Do not use when the user explicitly asked for an exploratory prototype (use `/prototype` which allows hallucination and missing handling).

## Core Stance

- Every code block the agent emits is untrusted until it passes all four gates. The agent is the generator and the first reviewer — these roles must be separated.
- Gate 1 (Hallucinated APIs) is the most common LLM failure mode. If an API call cannot be verified in the actual installed dependency's source, it does not exist.
- Gate 2 (Over-engineering) catches the LLM's tendency to build frameworks instead of solutions. The simplest approach that handles the requirements is correct. "We might need this later" is not a requirement.
- Gate 3 (Error handling) catches the LLM's tendency to write happy-path code. Every async/IO/network call without error handling is a bug waiting for production.
- Gate 4 (Assumptions) catches the LLM's tendency to assume instead of verify. Every claim about a file path, config value, or dependency version must be verified.

## Research Backing

- **Andrej Karpathy (2024–2025)**, documented LLM coding failure modes via X/Twitter threads and technical talks — four recurring patterns: hallucinated APIs (invented functions/imports), over-engineered solutions (abstractions when a simple script would do), missing error handling (happy-path-only code), and unverified assumptions (assuming file structure/config/dependencies without checking).
- **Shinn et al. (Princeton, 2024)**, *Reflexion: Language Agents with Verbal Reinforcement Learning* — self-audit loops improve output quality more than single-pass generation; multi-gate self-review catches errors the generation step missed.
- **Dhuliawala et al. (Meta FAIR, ACL 2024)**, *Chain-of-Verification Reduces Hallucination* — post-hoc verification chains reduce hallucination by 28%; applied here as Gate 1 + Gate 4 verification.

## Process

1. **Gate 1 — Hallucinated APIs**
   - For every imported function, class, or method used in the code block: verify it exists in the dependency's actual source.
   - Verification: `grep -rn "export.*functionName" node_modules/<package>/src/` or read the relevant source file.
   - For standard library/Web APIs: check MDN compatibility data or language specification version.
   - Mark each API call as: VERIFIED (confirmed in source), UNVERIFIED (could not confirm), or HALLUCINATED (confirmed not to exist).
   - **Gate:** no HALLUCINATED APIs allowed. UNVERIFIED APIs must carry `[UNVERIFIED API — check docs]` tag.

2. **Gate 2 — Over-engineered solutions**
   - For each abstraction, class, or utility in the code block: ask — "does the requirement justify this?"
   - Can the solution be expressed in half the lines? Can a class be a function? Can a framework be a script?
   - Signs of over-engineering: unused parameters, premature generalization, "just in case" extensibility, factory-for-a-single-implementation.
   - **Gate:** any abstraction not directly required by the spec must be justified in a code comment. If not justifiable, remove it.

3. **Gate 3 — Missing error handling**
   - For every async/IO/network call in the code block: is there a catch, try/catch, `.catch()`, or error boundary?
   - Check: `fetch()`, `axios.*`, `db.query()`, `redis.*`, `fs.readFile()`, `child_process.exec()`, `await Promise.all()`, event listeners, timers.
   - For each: is the error surfaced? Is the error action appropriate (retry, fallback, user message, log-and-continue)?
   - **Gate:** every async/IO/network call must have error handling. Unhandled Promise rejections are blocking.

4. **Gate 4 — Unverified assumptions**
   - For every claim in the code block about the environment: verify against the actual codebase.
   - Check: file paths, config keys, dependency versions, API route shapes, database schema.
   - For each assumption: run a verification command (`grep`, `read_file`, `glob`, shell command).
   - **Gate:** no unverified assumptions. Every assumption either verified or tagged `[ASSUMPTION — not verified]`.

5. **Re-check after fixes**
   - If any gate fails: apply the fix, then re-run all four gates from the top.
   - The fix for one gate may introduce a failure in another gate (e.g., adding error handling introduces a new API call).
   - **Exit:** all four gates pass or the code block is marked `[GATE: N FAILED]` with specific gate failures.

## Operating Rules

- Run all four gates in order. Don't skip a gate because you're confident.
- Gate 1 must verify against actual installed source, not memory. Read the file, don't recall it.
- Gate 2 does not mean "use the fewest lines." Sometimes an abstraction genuinely reduces complexity. The test is: "does this add complexity or reduce it?"
- Gate 3 error handling must be appropriate, not ceremonial. `catch (e) {}` is not error handling.
- Gate 4 must use tool invocations, not memory. Yesterday's file structure may not be today's.
- A gate failure on code the user explicitly requested (e.g., "use a factory pattern") is not a gate failure — note "per user request" and pass.

## Output Format

Return a markdown report with these exact sections:

- Code Block (file path, function name, line count)
- Gate 1 — Hallucinated APIs (table: API, source, status)
- Gate 2 — Over-engineering (abstractions found, justification, verdict)
- Gate 3 — Error Handling (IO calls found, handler present, verdict)
- Gate 4 — Assumptions (claim, verification result, status)
- Gate Summary (PASS/FAIL per gate)
- Overall Verdict (PASS / FAIL with specific failures)
- Fixes Applied (if any)

## Example

### Code Block

`packages/cart/src/discount.ts:1–42` — `applyDiscount()` function, 42 lines

### Gate 1 — Hallucinated APIs

| API | Source | Status |
|-----|--------|--------|
| `stripe.coupons.retrieve()` | `node_modules/stripe/types/lib.d.ts:1203` | VERIFIED |
| `Math.roundTo()` | Not found in MDN or Node.js 22 docs | **HALLUCINATED** |

**Gate 1: FAIL** — `Math.roundTo()` does not exist. Fix: use `Math.round(value * 100) / 100`.

### Gate 2 — Over-engineering

The `DiscountStrategy` abstract class + `PercentageDiscount` + `FixedDiscount` implementations serve a single call site. The requirement is "apply a coupon code." **Verdict: Over-engineered.** Fix: replace with a single `applyDiscount(coupon, subtotal)` function. Gate 2 re-run after fix: PASS.

### Gate 3 — Error Handling

| Call | Handler | Status |
|------|---------|--------|
| `stripe.coupons.retrieve(id)` | `.catch()` with fallback to `{discount: 0}` | PASS |
| `await db.query(...)` | No catch, no try/catch | **FAIL** |

**Gate 3: FAIL** — `db.query()` has no error handling. Fix: wrap in try/catch, return `{discount: 0, error: "coupon lookup failed"}` on failure.

### Gate 4 — Assumptions

| Claim | Verification | Status |
|-------|-------------|--------|
| "Coupon codes are uppercase" | `grep -rn "coupon" src/` shows lowercase in 3 test fixtures | **UNVERIFIED — assumption false** |
| "Subtotal is in cents" | `packages/cart/src/types.ts:8` confirms `subtotal: number // cents` | VERIFIED |

**Gate 4: FAIL** — coupon code casing assumption is wrong. Fix: add `.toUpperCase()` on input, or accept mixed-case.

### Overall Verdict

**FAIL** — Gates 1, 3, 4 failed. Fixes applied: `Math.roundTo` → `Math.round(value * 100) / 100`; added try/catch on `db.query`; added `.toUpperCase()` on coupon code input. Re-running all gates: **PASS**.
