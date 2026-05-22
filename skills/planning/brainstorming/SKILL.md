---
name: brainstorming
description: >-
  Hard gate that prevents code generation until a design document is approved.
  Reads the codebase first, interviews the user one question at a time, proposes
  2–3 named approaches with trade-offs, and saves a structured design doc to
  docs/brainstorms/. Use when requirements are vague or multiple valid
  interpretations exist.
---

## When To Use

- User's request contains vague verbs: "improve", "optimize", "make it better", "handle it."
- Request could be interpreted in >2 ways.
- Problem involves a novel domain, algorithm, or integration the team hasn't built before.
- User says "I'm not sure what the best approach is" or "What do you think we should do?"
- Task touches architectural boundaries (database schema, API contract, deployment topology).
- Before starting any greenfield feature or major refactor.

Related: `/grill-me` for well-scoped tasks needing clarification; `/to-prd` for formalizing brainstorm output; `/plan-eng-review` for locking architecture after approach is chosen.

Do not use this skill when the user provides a complete PRD upfront or when the task is small (<3 files). Skip to `/grill-me` in those cases.

## Core Stance

- The most expensive code is the code written to answer the wrong question. When requirements are vague, humans and agents converge on the first plausible interpretation and start building — creating a sunk-cost trap.
- Brainstorming is a hard gate that enforces design-before-build. It produces a decision record, not code.
- The only permitted output is the design document and questions. No implementation code, no file modifications, no generated test cases, no branches or PRs.

## Research Backing

- **Osborn (1953)**, *Applied Imagination* — Brainstorming as a structured creative process: defer judgment, generate multiple alternatives before convergence.
- **Evans (2003)**, *Domain-Driven Design* — Exploration of the problem space before committing to a solution space is fundamental to building software that matches domain reality.
- **Brooks (1995)**, *The Mythical Man-Month* — Conceptual integrity requires centralized design decisions; brainstorming provides the forum for making those decisions before implementation fragments them.

## Process

1. **Read first, ask second** — Before first question, read `README.md`, `CONTEXT.md`/`AGENTS.md`, files user mentioned, recent commits, existing `docs/brainstorms/`. First question must demonstrate codebase familiarity: "I see you use Repository pattern with Prisma. Follow that or open to Query Builder for performance?"
2. **One question at a time** — Sequential confrontation prevents user from answering only the easy parts.
3. **Propose named approaches** — Exactly 2 or 3 approaches. Each with: memorable name, 2-sentence description, 3 pros, 3 cons, time estimate and risk level (Low/Medium/High), when-to-choose condition. Forbidden: single "recommended" approach. User must choose.
4. **Declare trade-offs** — Force user to declare optimization target: consistency vs availability, speed vs maintainability, type safety vs flexibility, cost vs performance.
5. **Brainstorm failure modes** — For each approach: "How does this fail in production?", "What is the blast radius?", "What is the rollback story?", "What monitoring would detect failure before users notice?"
6. **Document everything** — Save to `docs/brainstorms/BRAINSTORM_YYYYMMDD_[topic].md`.
7. **Gate on approval** — Not complete until: user explicitly chooses approach, answers all trade-off questions, confirms failure modes acceptable, provides success criterion. If user tries to skip to code: "Brainstorm not approved. Approaches are A, B, or C. Choose one, or request a fourth. No code until then."

## Operating Rules

- No code until approved. Period.
- Named approaches only — no generic "Option 1, Option 2."
- Always present 2–3 approaches, never one.
- Force explicit trade-off declarations for every decision.
- After brainstorming approved, run `/to-prd` to convert into formal PRD.
- If task is <3 files, skip brainstorming and use `/grill-me` instead.

## Output Format

Save to `docs/brainstorms/BRAINSTORM_YYYYMMDD_[topic].md`:
```markdown
# Brainstorm: [Topic]
## Context
[What we know about the codebase and current state]
## Problem Statement
[The user's request, translated into operational terms]
## Constraints
- [Hard constraint: e.g., must use existing PostgreSQL instance]
- [Soft constraint: e.g., prefer TypeScript over Python]
## Approaches
### Approach A: [Name]
- Description: ...
- Pros: ...
- Cons: ...
- Cost: ...
- When to choose: ...
### Approach B: [Name]
...
### Approach C: [Name] (optional)
...
## Trade-off Decisions
- [Decision 1]: User chose [X] over [Y] because [reason]
## Failure Modes
- [Approach A]: [How it fails] → [Mitigation]
## Recommendation
[The user's explicit choice, verbatim]
## Next Steps
- [ ] User approves this document
- [ ] Create PRD from this brainstorm
- [ ] Break into issues
```

## Example

**User**: "I need to add a notification system."

**Agent**: "I see you use PostgreSQL with Prisma and React frontend. First question: notifications are (A) in-app only (bell icon, stored in DB), (B) push only (mobile/web push, stored in Firebase), or (C) both? Each has different infrastructure costs."

**User**: "In-app only for v1."

**Agent**: "Delivery mechanism: (A) polling every N seconds (simple, expensive at scale), (B) WebSockets via Socket.io (real-time, requires server management), or (C) Server-Sent Events (one-directional, HTTP-native, browser-native)? Database stays the same across all three."

**User**: "Server-Sent Events. Simpler than WebSockets."

**Agent**: "Approach A: Polling. Approach B: WebSockets. Approach C: SSE. [Documents all three with pros/cons]. You chose C. Trade-off: SSE limits you to one-directional server→client. Acceptable?"

**User**: "Yes. We don't need client→server for this."

**Agent**: "Brainstorm approved. Approach C (SSE) selected. Saving to `docs/brainstorms/BRAINSTORM_20260522_notification-system.md`."
