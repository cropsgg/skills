---
name: domain-context
description: "Build and maintain shared domain language in CONTEXT.md and ADRs."
---

## When To Use

- Starting work on a repo with jargon-heavy or inconsistent naming.
- After `/requirements-grill` when terms were clarified but not documented.
- When agents repeat verbose explanations because domain terms are undefined.
- When adding a feature that introduces new bounded-context vocabulary.

Related: `/requirements-grill` for initial alignment; `/docs-sync` after behavior ships.

Do not use this skill for replacing full architecture docs on greenfield systems with no code yet — pair with planning skills first.

## Core Stance

- A **shared language** reduces tokens, bugs, and review friction.
- `CONTEXT.md` is the glossary + core concepts; ADRs capture **decisions**, not tutorials.
- Names in code, tests, and docs should use the same terms.
- Update context when terminology shifts — stale glossaries mislead agents.

## Research Backing

- **Evans (2003)**, *Domain-Driven Design* — ubiquitous language as first-class artifact.
- **Nygard (2011)**, *Documenting Architecture Decisions* — ADR format for reversible decision records.
- **Hunt & Thomas (1999)**, *The Pragmatic Programmer* — "Program close to the problem domain."

## Process

1. **Inventory terms**
   - Scan README, key modules, and recent PR titles for repeated nouns/verbs.
   - List terms used inconsistently (e.g. "order" vs "cart" vs "checkout").
2. **Draft CONTEXT.md** (repo root or `docs/CONTEXT.md` per project convention)
   - **Glossary:** term → one-line definition → example usage
   - **Core concepts:** 3–7 bullets linking terms to system parts
   - **Anti-patterns:** deprecated terms not to use
3. **Identify decision gaps**
   - For each ambiguous design choice, draft a short ADR in `docs/adr/NNNN-title.md`:
     - Context, Decision, Consequences, Status
4. **Align code references**
   - Propose renames only when user approves; document aliases during transition.
5. **Validate**
   - Re-read one complex module using only CONTEXT.md — terms should map cleanly.

## Operating Rules

- Keep CONTEXT.md under ~200 lines; link to ADRs for depth.
- Do not invent business rules not stated by the user or code.
- ADR numbers sequential; never rewrite history — supersede with new ADR.
- Match existing repo doc layout when present.

## Output Format

Return a markdown report with these exact sections:

- Terms Standardized (before → after)
- CONTEXT.md Changes (path + summary)
- ADRs Created or Updated (paths)
- Code Naming Recommendations (optional, non-blocking)
- Follow-ups

## Example

### Terms Standardized

- "listing" → **materialized lesson** (file on disk after publish)

### CONTEXT.md Changes

- Created `docs/CONTEXT.md` with 12 glossary entries

### ADRs Created

- `docs/adr/0003-materialization-cascade.md` — publish triggers filesystem write
