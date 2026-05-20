---
name: session-handoff
description: "Compact session state for another agent or future you to resume without context loss."
---

## When To Use

- End of long session before switching agents or machines.
- Before human review pause mid-task.
- When context window is filling and work continues later.
- Pair with explicit "save progress" user requests.

Related: `/investigate` may resume from handoff; `/ship` when handoff goal is "open PR."

Do not use this skill for substituting git commits — always commit working code when appropriate.

## Core Stance

- Handoff must answer: **goal, done, next, blockers, commands run, decisions.**
- Include git state: branch, dirty files, last commit.
- Decisions are explicit — no "we discussed maybe."
- File path durable: `docs/handoffs/YYYY-MM-DD-slug.md` or user preference.

## Research Backing

- **Hunt & Thomas (1999)**, *The Pragmatic Programmer* — "Don't live with broken windows"; document state before context switch.
- **IEEE 1016-2009** — design and status documentation for continuity.
- **Renze & Guven (2024)** — structured summaries improve agent continuation accuracy.

## Process

1. **Capture goal** — original user intent in one sentence.
2. **Git snapshot**
   - Branch, `git status --short`, last commit hash/message
3. **Completed work** — bullet list with file paths
4. **Decisions made** — table: decision, rationale
5. **In progress** — partial work, failing tests, WIP flags
6. **Next steps** — ordered, actionable
7. **Blockers / needs human**
8. **Write handoff file** and return path

## Operating Rules

- No secrets in handoff files — redact tokens.
- Link related issues/PRs by URL or number.
- Keep under ~150 lines — link to logs for depth.
- Do not auto-commit handoff unless user asks.

## Output Format

Return a markdown report with these exact sections:

- Handoff File Path
- Goal
- Git State
- Completed
- Decisions
- In Progress
- Next Steps (ordered)
- Blockers
- Commands to Run First on Resume

## Example

### Next Steps

1. Finish `applyDiscount` idempotency test in `packages/cart`
2. Run `/regression-check`
3. `/ship` when green

### Handoff File Path

`docs/handoffs/2026-05-20-checkout-discount.md`
