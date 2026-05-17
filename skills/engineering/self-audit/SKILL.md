---
name: self-audit
description: "Audit the agent's own session changes for bugs, runtime errors, and spec drift."
---

## When To Use

- After completing a non-trivial implementation chunk (multiple files, new control flow, or data model touch).
- When requirements are implicit, conversational, or changed mid-session (“soft specs”).
- Before declaring “done” when no human reviewer has validated the diff yet.
- When you introduced async/concurrency, caching, auth checks, or nullable boundaries.
- When you touched API shapes, configuration defaults, or migrations—even if tests pass locally.

Related: `/regression-check` for full test-suite validation.

Do not use this skill for pure documentation-only edits where no executable behavior changed, unless the docs describe behavior that is now false.

## Core Stance

- Assume the system is flawed until you can cite concrete checks against the code paths you changed.
- Do not defend prior messages; treat every statement about behavior as a hypothesis.
- Prefer finding **one** blocking defect over producing **ten** shallow compliments.
- Separate “cannot verify” from “verified safe”—never imply proof you did not obtain.

## Research Backing

- **Renze & Guven (Johns Hopkins University, 2024)**, *Self-Reflection in LLM Agents: Effects on Problem-Solving Performance* — self-reflection improved LLM accuracy with **p < 0.001** across **GPT-4**, **Llama 2 70B**, and **Gemini 1.5 Pro**.
- **Dhuliawala et al. (Meta FAIR, ACL 2024)**, *Chain-of-Verification Reduces Hallucination in Large Language Models* — **CoVe** reduced list hallucinations from **2.95 to 0.68** entities and improved **FACTSCORE** from **55.9 to 71.4**.
- **Zhang et al. (NTU / Skywork AI, 2025)**, *Incentivizing LLMs to Self-Verify Their Answers* — self-verifying models matched **GPT-4o** and **Claude-3.7-Sonnet** verification accuracy.
- **Li et al. (BIGAI / Peking University, ACL 2025)**, *ReflectEvo: Improving Meta Introspection of Small LLMs by Reflection Learning* — iterative reflection improved **Llama-3-8B** from **52.4% to 71.2%** and **Mistral-7B** from **44.4% to 71.1%**.

## Process

1. **Re-anchor the spec**
   - Restate the user goal as testable acceptance criteria (bullets, not prose essays).
   - Mark what is explicitly **out of scope** to prevent scope creep disguised as “fixes.”
2. **Build a change inventory**
   - List touched files with `git diff --name-only` (or equivalent).
   - For each file, classify: behavioral change vs refactor vs comments-only.
3. **Trace critical execution paths**
   - Walk call chains for the “happy path” **and** at least one failure path per external dependency.
   - For React/TypeScript: verify hooks rules, effect dependencies, and event-handler nullability.
   - For Node/Python services: verify parsing, validation, and error serialization boundaries.
4. **Hunt invariant breakers**
   - Enumerate inputs: empty collections, `null`, unicode, huge payloads, slow networks, duplicate events.
   - Check concurrency: double-submit, replayed webhooks, retried jobs, stale cache reads.
5. **Cross-check contracts**
   - If types exist, ensure the implementation matches exported types and runtime JSON shapes.
   - If OpenAPI/GraphQL schemas exist, diff them against handlers and client expectations.
6. **Run the smallest honest verification**
   - Prefer targeted commands: `pnpm test <file>`, `pytest -k`, `mypy`, `tsc --noEmit`—whatever matches the repo.
   - If you cannot run commands, say so and rely on tighter code reasoning (mark confidence lower).

## Operating Rules

- Be precise, technical, and critical.
- Do not skip complex areas because they are hard to verify. Mark them **unverified** with next steps.
- Prefer evidence from code paths and validation output over intuition.
- Every finding must include **file path + anchor** (function/component) and a **repro trigger** when possible.
- Do not label something “safe” because tests passed once; name what those tests actually cover.
- If you find yourself re-auditing the same class of defect, propose a systemic guard (lint rule, type, test).

## Output Format

Return a markdown report with these exact sections:

- Critical Issues
- Major Issues
- Minor Issues
- Duplicate / Redundant Systems
- Missing / Incomplete Features
- Risk Assessment

Under each issue bullet, use this mini-template:

- **Symptom:** …
- **Evidence:** …
- **Fix:** …
- **Verify:** …

## Example

### Critical Issues

- **Symptom:** Payment webhook may apply twice under retries.
- **Evidence:** `services/billing/src/webhooks/stripe.ts` — `handleEvent` inserts before uniqueness check on `event.id`.
- **Fix:** enforce unique `(provider, event_id)` + `ON CONFLICT DO NOTHING` / idempotent handler return.
- **Verify:** run `pnpm test services/billing -t stripeWebhook`; simulate duplicate delivery in staging.

### Major Issues

- **Symptom:** `useEffect` refetches on every render due to unstable object dependency.
- **Evidence:** `apps/web/app/dashboard/page.tsx` lines 40–55 — inline `{ ...filters }` in dependency array.

### Risk Assessment

Ship risk is **high** until idempotency is proven; duplicate charges are a correctness and compliance problem.
