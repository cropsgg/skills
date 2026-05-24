---
name: autoplan
description: "Run the full planning pipeline in one command: CEO review → design review → engineering review → locked plan → issue decomposition. Sequential gated pipeline with pass/fail at each stage."
---

## When To Use

- Starting a feature of medium-to-high risk with a clear initial idea but no spec yet.
- When a user says "plan this out end-to-end" or "run the full planning pipeline."
- When the cost of a missed dimension (product scope, design quality, architecture flaw) is higher than the cost of running all three reviews.
- Before a sprint where multiple features need locked plans quickly.
- As a pre-implementation gate on features above a risk threshold (>3 files, new service, new UI).

Related: `/plan-ceo-review` for product scope and ambition; `/plan-design-review` for dimensional design scoring; `/plan-eng-review` for architecture lock and test plan; `/to-prd` to formalize into a spec; `/to-issues` to decompose into vertical slices.

Do not use this skill for trivial changes (<3 files, no new services, no UI, no API changes), for features where only one review dimension matters, or when the user explicitly wants to run reviews interactively one at a time.

## Core Stance

- Planning is a pipeline, not a meeting. Sequential reviews catch what parallel reviews miss — CEO catches scope bloat, design catches UX gaps, engineering catches architecture flaws.
- Each stage gates on the prior stage's output. No review advances without a confirmed pass from the previous review.
- The pipeline is designed to fail fast. If CEO review says "scope too broad," stop and fix the scope — don't run design and engineering on an unbounded plan.
- The output is a single locked plan document, not three separate reports. Merge the findings into one coherent plan.
- Issue decomposition is the final deliverable, not an afterthought. A locked plan without decomposed issues is not actionable.

## Research Backing

- **Brooks (1995)**, *The Mythical Man-Month* — design reviews reduce defect injection by 50% or more when run before implementation; the cost of fixing a planning flaw grows exponentially with project phase.
- **Google Design Doc Culture** — structured, multi-phase review of design documents before implementation begins; sequential review layers (product → UX → engineering) catch different classes of issues.
- **Beyer et al. (Google, 2016)**, *Site Reliability Engineering*, Chapter 8 — progressive rollout and gated deployment pipelines as a model for gated planning: each stage validates before the next begins.
- **Cohn (2004)**, *User Stories Applied* — vertical-slice decomposition as the bridge between planning and execution; issues must be independently grabbable and testable.

## Process

1. **CEO review** — `/plan-ceo-review`
   - Gate: is the scope locked? Are goals and non-goals explicit? Is ambition level set?
   - If scope is too broad: narrow it and re-run. Do not proceed with unbounded scope.

2. **Design review** (if UI exists) — `/plan-design-review`
   - Gate: are all dimensions ≥7? If any dimension is below 7 and blocking, fix the plan before proceeding.
   - Skip this stage if the feature has no UI surface.

3. **Engineering review** — `/plan-eng-review`
   - Gate: architecture locked? Data flow diagrammed? Edge case matrix filled? Test plan exists? Rollout strategy defined?
   - If any gate fails: fix the architecture before proceeding.

4. **Merge findings**
   - Produce one locked plan document combining: product scope (from CEO), design decisions (from design review), architecture (from eng review).
   - Format: `docs/plans/PLAN_YYYYMMDD_[feature-slug].md`.
   - Include all gates and their pass/fail status.

5. **Generate PRD** — `/to-prd`
   - Synthesize the locked plan into a PRD and file as a GitHub issue.
   - Link the PRD issue to the locked plan document.

6. **Decompose into issues** — `/to-issues`
   - Break the PRD into independently grabbable vertical-slice GitHub issues.
   - Each issue must be completable in one session and independently testable.

7. **Report** with pipeline summary, locked plan path, PRD issue URL, and issue list.

## Operating Rules

- Never skip a stage without an explicit user decision. "We don't need design review" must come from the user, not assumed.
- Never proceed past a failed gate without fixing the issue. "We'll fix it later" is not accepted at the planning stage.
- The plan document must cite which review produced each section. Traceability from decision to review stage.
- If a review stage produces conflicting recommendations with a prior stage, resolve the conflict explicitly — do not paper over it.
- The PRD must not introduce new requirements not present in the locked plan. PRD synthesizes, does not expand.
- Issue decomposition must produce issues that are independently grabbable — no issue should say "depends on issue #42 being fully complete."

## Output Format

Return a markdown report with these exact sections:

- Pipeline Summary (stage → gate status → output)
- CEO Review Outcome (scope, goals, non-goals)
- Design Review Outcome (dimensional scores, blocking dimensions resolved)
- Engineering Review Outcome (architecture, edge cases, test plan, go/no-go)
- Locked Plan Path
- PRD Issue URL
- Decomposed Issues (list of issue URLs + titles)
- Recommended Next Step

## Example

### Pipeline Summary

| Stage | Gate Status | Output |
|-------|-------------|--------|
| CEO Review | PASS | Scope locked: checkout flow with coupon support. Non-goal: subscription billing. |
| Design Review | PASS (after amendments) | Accessibility raised 3→7, Color 4→8. All dimensions ≥7. |
| Engineering Review | PASS with condition | GO — condition: add idempotency key to webhook handler before retry. |

### Locked Plan Path

`docs/plans/PLAN_20260524_checkout-coupons.md`

### PRD Issue URL

https://github.com/org/repo/issues/201

### Decomposed Issues

1. #202 — Add coupon field to checkout UI with validation
2. #203 — Implement coupon discount calculation in cart service
3. #204 — Add idempotency key to checkout webhook handler
4. #205 — Integration tests for coupon-aware checkout flow

### Recommended Next Step

Start with issue #203 (backend calculation — unblocks #202 and #205). Run `/tdd` on first issue.
