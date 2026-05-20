---
name: architecture-improvement
description: "Find deepening opportunities and boundary fixes using domain language."
---

## When To Use

- Codebase feels like a "ball of mud" — tangled imports, god modules, leaky abstractions.
- Before a large feature that would worsen coupling without cleanup.
- Periodic (e.g. weekly) architecture hygiene on active modules.
- After reading `CONTEXT.md` when names no longer match structure.

Related: `/domain-context` for glossary; `/zoom-out` for orientation; `/plan-eng-review` before big changes.

Do not use this skill for greenfield repos with <10 files or when user wants a full rewrite without incremental plan.

## Core Stance

- **Deep modules, simple interfaces** (Ousterhout) — push complexity down, narrow public API.
- Prefer incremental extractions over big-bang rewrites.
- Every recommendation ties to a **pain** (test difficulty, bug class, change cost).
- Use domain terms from `CONTEXT.md` in proposed module names.

## Research Backing

- **Ousterhout (2018)**, *A Philosophy of Software Design* — deep modules, information hiding, complexity reduction.
- **Evans (2003)**, *Domain-Driven Design* — bounded contexts and anti-corruption layers.
- **Martin (2017)**, *Clean Architecture* — dependency rule and use-case boundaries.

## Process

1. **Orient**
   - Read `CONTEXT.md`, `docs/adr/`, top-level folder layout.
   - Apply `/zoom-out` on the smelliest directory if unfamiliar.
2. **Detect smells**
   - God files (>500 LOC with mixed concerns)
   - Circular imports
   - Leaky domain logic in UI/API handlers
   - Duplicate business rules
   - Missing boundaries (DB types in React components)
3. **Prioritize 3–5 improvements**
   - Score: pain × feasibility; prefer low-risk extractions first.
4. **Propose concrete steps**
   - New module name, what moves, what stays, tests to add.
5. **Optional small PR slice**
   - Only if user asks to implement — one improvement per PR.

## Operating Rules

- Do not recommend rewrite-for-rewrite's sake.
- Quantify when possible: "3 call sites duplicate discount logic."
- Respect YAGNI — defer abstractions until second use case.
- Match repo style and test patterns.

## Output Format

Return a markdown report with these exact sections:

- Current Architecture Snapshot
- Smells Identified (with paths)
- Recommended Improvements (ranked)
- Incremental Plan (PR-sized steps)
- Risks of Inaction
- Suggested First PR Scope

## Example

### Recommended Improvements

1. Extract `packages/pricing` from `apps/web/lib/pricing.ts` — 4 duplicated call sites
2. Introduce `OrderRepository` boundary — SQL currently in route handlers

### Suggested First PR Scope

Move discount pure functions to `packages/pricing` with unit tests; no route changes.
