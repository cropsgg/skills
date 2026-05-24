---
name: evaluator-optimizer-loop
description: "Split the workflow into Evaluator and Optimizer personas. Evaluator scores output 1–10 on correctness, completeness, safety, and simplicity. Optimizer rewrites to address critiques. Loop until score ≥9 or 3 iterations. Self-improvement without measurement is guessing."
---

## When To Use

- When generating complex output (architecture designs, PRDs, multi-file implementations) where quality is hard to judge in one pass.
- When the first attempt feels "good enough" but hasn't been measured — replace intuition with scores.
- Before shipping a high-stakes output (production config, auth implementation, data migration) where a defect is expensive.
- When the user asks "is this the best we can do?" — run the loop and show the score progression.
- When output quality has been inconsistent and a structured improvement process is needed.

Related: `/karpathy-rules` as a lightweight 4-gate alternative (faster, less comprehensive); `/chain-of-verification` for verifying factual claims; `/adversarial-self-test` for security-specific evaluation.

Do not use this skill for quick answers, simple facts, or code that takes <30 seconds to generate. The loop overhead isn't worth it for trivial output. Do not use when the user explicitly wants a fast, unpolished draft.

## Core Stance

- Self-improvement without measurement is guessing. Score before fixing, not fix then hope.
- The Evaluator persona is adversarial, not supportive. It looks for what's wrong, not what's right. The Optimizer persona is constructive, not defensive. It addresses critiques without rationalizing.
- Scoring dimensions are explicit. No "overall 7/10." Score each dimension separately: correctness, completeness, safety, simplicity. A "7" with specific critique is actionable; a "7" without critique is a feeling.
- The loop has an exit condition: score ≥9 on all dimensions, OR 3 iterations reached. Without a convergence gate, the loop becomes perfectionism that never ships.
- Three iterations is the limit. If the output hasn't reached ≥9 by iteration 3, it's not going to. Ship with the score and the open issues documented.

## Research Backing

- **OpenAI (2024)**, *Evaluator-Optimizer Pattern* — documented agent design pattern: separate evaluation and optimization passes improve output quality more than single-pass generation with self-critique. Used in the OpenAI Cookbook for complex task decomposition.
- **Ma et al. (2025)**, *Self-Improving LLM Agents: A Survey* — iterative refinement with explicit scoring criteria improves downstream task performance across diverse benchmarks; evaluator-optimizer splitting improves upon single-model self-correction.
- **Anthropic (2024)**, *Constitutional AI* — iterative refinement with explicit principles; a "critique → revise" loop guided by a constitution of rules produces safer, more aligned outputs than single-pass generation.
- **Shinn et al. (Princeton, 2024)**, *Reflexion* — self-evaluation and iterative improvement loops; the evaluator-optimizer split is a structured instantiation of the Reflexion pattern.

## Process

1. **Generate initial output**
   - Produce the first draft of the output without self-critique during generation.
   - The draft must be complete — the Evaluator scores what exists, not what's missing.

2. **Evaluator persona scores**
   - Adopt the Evaluator role: adversarial, evidence-driven, specific.
   - Score each dimension:
     - **Correctness (1–10):** are all facts correct? Are API calls valid? Are file paths accurate? Does the logic hold?
     - **Completeness (1–10):** are all requirements addressed? Are edge cases covered? Are error states described?
     - **Safety (1–10):** are there injection surfaces? Are timeouts present? Are permissions checked? Is error handling adequate?
     - **Simplicity (1–10):** is this the simplest approach that works? Are there unnecessary abstractions? Can it be expressed in fewer steps?
   - For each dimension below 9: write a specific, actionable critique. Not "could be better" but "the error handling at step 3 doesn't cover the timeout case."
   - If score ≥9 on all dimensions: skip to step 5. Output is done.

3. **Optimizer persona rewrites**
   - Adopt the Optimizer role: constructive, focused, critique-targeted.
   - For each critique: rewrite the relevant section. Do not touch sections that scored ≥9.
   - Do not add scope — the Optimizer fixes, does not expand.
   - Record what was changed and why.

4. **Re-evaluate**
   - Return to Evaluator persona. Score the revised output on the same 4 dimensions.
   - Compare scores to the previous iteration. Did they improve? Did any dimension get worse?
   - If score ≥9 on all dimensions: done.
   - If iteration 3 reached and still <9 on any dimension: stop. Ship with the score and document the open issues.

5. **Emit final output**
   - Include the final scores per dimension.
   - If scores <9 after 3 iterations, tag the output: `[SCORE: N/10 — iteration limit reached]` with unresolved critiques.
   - Record the iteration history for transparency.

## Operating Rules

- The Evaluator must be specific. Every critique below 9 must cite what's wrong and how to fix it.
- The Optimizer must not add scope. Fixing a critique by adding a new feature is scope creep.
- A score of 10 means "I cannot find a flaw." Reserve 10 for outputs you'd stake your reputation on.
- The 3-iteration limit is strict. The loop is for improvement, not perfection.
- If a dimension regresses between iterations, flag it — the Optimizer made something worse. Investigate why.
- Don't use the evaluator-optimizer loop on user-facing conversational output. It produces stilted, over-polished prose.

## Output Format

Return a markdown report with these exact sections:

- Iteration 1 — Scores (table: dimension, score, critique)
- Iteration 2 — Scores (if applicable, with delta from iteration 1)
- Iteration 3 — Scores (if applicable, with delta from iteration 2)
- Final Output (the optimized output)
- Score Progression (iter 1 → iter N per dimension)
- Unresolved Critiques (if any after iteration 3)
- Convergence Status (CONVERGED / ITERATION LIMIT REACHED)

## Example

### Iteration 1 — Scores

| Dimension | Score | Critique |
|-----------|-------|----------|
| Correctness | 6 | `stripe.charges.create` called with `amount` in dollars — Stripe API expects cents. Double-charge risk. |
| Completeness | 7 | Missing: what happens when the coupon code is invalid? |
| Safety | 5 | `fetch(url)` with no timeout on payment callback. Webhook handler has no signature verification. |
| Simplicity | 8 | Clean structure. One unnecessary middleware layer. |

### Iteration 2 — Scores

| Dimension | Score | Δ | Critique |
|-----------|-------|---|----------|
| Correctness | 9 | +3 | Amount conversion added. Verified against Stripe docs. |
| Completeness | 9 | +2 | Invalid coupon returns 400 with `{ error, validCoupons }`. |
| Safety | 8 | +3 | Timeout added on fetch. Webhook signature verification added. Missing: idempotency key on charge. |
| Simplicity | 8 | 0 | — |

### Iteration 3 — Scores

| Dimension | Score | Δ |
|-----------|-------|---|
| Correctness | 10 | +1 |
| Completeness | 9 | 0 |
| Safety | 9 | +1 — idempotency key added |
| Simplicity | 8 | 0 |

### Convergence Status

**CONVERGED** — all dimensions ≥9 except Simplicity (8). The remaining middleware layer is justified by the requirement for shared logging across 3 endpoints.

### Final Output

(Final implementation with all fixes applied)
