---
name: requirements-grill
description: "Relentless Q&A until every branch of the plan decision tree is resolved."
---

## When To Use

- Before writing code when requirements feel vague or assumed.
- When the user says "build X" without acceptance criteria, edge cases, or scope boundaries.
- After a brainstorm but before `/plan-eng-review` or implementation.
- When misalignment caused rework in a prior session.

Related: `/domain-context` to capture shared language after grilling; `/to-prd` to formalize outcomes.

Do not use this skill for mid-implementation trivial fixes or when the user provided exhaustive specs.

## Core Stance

- No-one knows exactly what they want until questioned — your job is to surface hidden branches.
- Ask **specific** questions with concrete options; avoid yes/no when tradeoffs exist.
- Resolve ambiguities before architecture, not after.
- Stop when every open decision has an owner and a default for "if we don't decide."

## Research Backing

- **Hunt & Thomas (1999)**, *The Pragmatic Programmer* — "Don't gather requirements — dig for them."
- **Evans (2003)**, *Domain-Driven Design* — ubiquitous language reduces miscommunication between builders and domain experts.
- **Renze & Guven (2024)**, *Self-Reflection in LLM Agents* — structured interrogation improves problem-solving accuracy.

## Process

1. **Restate the goal** in one sentence; ask the user to confirm or correct.
2. **Enumerate decision branches**
   - Scope: in/out of v1
   - Users and permissions
   - Data model and persistence
   - Failure and edge cases
   - Non-functional: latency, offline, accessibility
3. **Ask in batches of 3–5** focused questions per turn; wait for answers.
4. **Challenge assumptions**
   - "What happens when…?" for empty, duplicate, unauthorized, slow paths.
5. **Record decisions**
   - Bullet list: Decision → Choice → Rationale.
6. **Exit criteria**
   - No unresolved "TBD" on critical paths; deferrals explicitly parked with owner.

## Operating Rules

- Do not start coding during the grill unless the user explicitly opts out.
- Prefer multiple-choice options when they clarify tradeoffs faster.
- Do not ask questions already answered in the thread — read history first.
- Summarize decisions at the end in a scannable list.

## Output Format

Return a markdown report with these exact sections:

- Goal (confirmed)
- Decisions Resolved (table: topic, decision, rationale)
- Open Questions (if any, with proposed defaults)
- Out of Scope (explicit)
- Recommended Next Step (e.g. `/to-prd`, `/plan-eng-review`)

## Example

### Decisions Resolved

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Auth | Session cookies only | Existing app pattern |
| Discount cap | Max 50% | Finance policy |

### Recommended Next Step

Run `/plan-eng-review` with the decisions above as constraints.
