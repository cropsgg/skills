---
name: prototype
description: >-
  Build a throwaway prototype to de-risk a design decision before committing to
  production code. Use for state-machine validation, API ergonomics testing, UI
  layout exploration, or algorithmic feasibility. The prototype is explicitly
  disposable — no tests, no types, no polish. Goal is learning speed, not
  shipping quality.
---

## When To Use

- Design involves a novel state machine, concurrency pattern, or algorithm.
- UI has >2 interactive elements with non-obvious interaction logic.
- API contract is being debated (REST vs GraphQL vs RPC, resource naming, nesting depth).
- Data model has >3 entities with ambiguous relationships.
- Team is arguing about "best practice" without data — build both variants and measure.
- User says "I'm not sure if this will work" or "Let's try it and see."

Related: `/brainstorming` for approach generation pre-prototype; `/to-prd` for formalizing findings into spec.

Do not use this skill when the approach is well-understood and the question is purely about implementation speed or code quality. Skip to `/tdd` in those cases.

## Core Stance

- Agents (and humans) over-commit to architectural decisions made in the abstract. Late-discovered design flaws cost not just rework but sunk-cost attachment that makes pivoting hard.
- The prototype's sole deliverable is knowledge, not code. The prototype is thrown away.
- Findings are preserved in `PROTOTYPE_FINDINGS.md` that informs the real implementation.

## Research Backing

- **Beck & Andres (2004)**, *Extreme Programming Explained*, 2nd ed. — Spike solutions (throwaway prototypes) reduce risk by validating assumptions before production investment; core XP practice.
- **Ries (2011)**, *The Lean Startup* — Build-Measure-Learn loops favor rapid experimentation over speculative architecture; prototype as minimum viable learning vehicle.
- **Brooks (1995)**, *The Mythical Man-Month* — "Plan to throw one away; you will, anyhow." Prototype as explicit first version that teaches what the real version must solve.

## Process

1. **Declare disposability** — Open every prototype: "This is a throwaway prototype. It will be deleted. No tests. No types. No lint. No review. Goal: answer [specific question] in <30 minutes."
2. **Define one question** — A prototype must have a single, falsifiable question. Multiple questions → multiple sequential prototypes.
3. **Set time box** — Default: algorithmic 15min, UI layout 20min, API ergonomics 25min, data model query patterns 30min. Set timer. When it rings, stop, document, delete.
4. **Minimize dependencies** — Use standard library, browser APIs, or single-file script. No framework install unless framework itself is test subject. `npx` for one-off tools. Inline styles for CSS. `console.log` for state.
5. **Build radical variations** — UI: (A) dense data-table, (B) card grid, (C) timeline view. API: (A) flat REST, (B) nested GraphQL, (C) tRPC. Toggle between them. Goal: expose trade-offs viscerally.
6. **Instrument everything** — Timing logs, state snapshots, render counts. Quantitative findings, not gut feelings: "Query time: 45ms for 1000 rows, 890ms for 50,000 rows."
7. **Write findings document** — `PROTOTYPE_FINDINGS.md`: hypothesis, method (1 sentence), quantitative results, qualitative observations, decision, risks for production.
8. **Delete immediately** — After findings documented, delete prototype. If user protests: "The value is in the findings, not the code. Keeping the code creates the illusion of progress."

## Operating Rules

- If user asks to "just use this as the base," refuse: "Prototypes are poisoned by speed. They contain hacks that become production debt. Start fresh after findings are documented."
- Do not add TypeScript, tests, or error handling — these are forbidden in prototype mode.
- Do not let the prototype grow beyond 500 lines.
- Do not use the prototype to generate the PRD — the PRD should exist first; the prototype validates it.

## Output Format

Produce `PROTOTYPE_FINDINGS.md`:
```markdown
# Prototype: [Question]
## Hypothesis
## Method
## Quantitative Results
## Qualitative Observations
## Decision
## Risks for Production
```

## Anti-Patterns

- **Prototype drift**: Prototype grows to 500+ lines, user says "it's basically done." → Kill immediately.
- **Prototype perfectionism**: Adding types, tests, error handling. → Forbidden.
- **Prototype as spec**: Using prototype to generate PRD. → PRD exists first; prototype validates.

## Example

**User**: "Can we compute dashboard aggregations in <100ms without materialized views?"

**Agent**: "Prototype: single-file script querying 50k rows with different aggregation strategies. Time box: 15min. No tests, no ORM, just raw SQL and timing logs."
