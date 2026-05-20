---
name: plan-ceo-review
description: "Rethink product scope: find the ambitious version without losing rigor."
---

## When To Use

- When a feature request may be underspecified or too literal ("add photo upload").
- Before committing to a narrow implementation that misses user value.
- When choosing between scope expansion, hold, or reduction.
- Early in greenfield or major feature planning.

Related: `/office-hours` for initial ideation; `/plan-eng-review` after scope is settled.

Do not use this skill for bug fixes, dependency bumps, or internal refactors with fixed scope.

## Core Stance

- Ask **what job the user is hiring the product to do**, not what ticket text says.
- Propose the "10-star" version, then negotiate scope with the user.
- Expansions are opt-in decisions — never silently widen scope.
- Reduction mode is valid — smallest wedge that proves demand.

## Research Backing

- **Christensen (2016)**, *Competing Against Luck* — jobs-to-be-done framing for product decisions.
- **Ries (2011)**, *The Lean Startup* — validated learning and minimum viable scope.
- **Norman (2013)**, *The Design of Everyday Things* — user goals vs feature lists.

## Process

1. **Reframe the problem**
   - User pain in one paragraph (specific person, specific failure of status quo).
2. **Challenge the premise**
   - Is the requested feature the real lever? List 2–3 alternative solutions to the same pain.
3. **10-star sketch**
   - What would delight, not merely satisfy? (magic moment in one sentence)
4. **Scope modes** (user picks or default Hold Scope)
   - **Expansion:** dream big; list expansions as separate opt-in items
   - **Selective expansion:** hold baseline + cherry-pick
   - **Hold scope:** rigor on current plan only
   - **Reduction:** strip to essential wedge
5. **Wedge recommendation**
   - Narrowest shippable slice that validates the riskiest assumption.
6. **Decisions log**
   - Accepted expansions, deferred ideas, explicit non-goals.

## Operating Rules

- Present expansions as optional — user must accept each.
- Do not dismiss constraints (time, team, compliance) — incorporate them.
- Persist decisions in plan output for downstream `/plan-eng-review`.
- Avoid hype; tie recommendations to user pain evidence.

## Output Format

Return a markdown report with these exact sections:

- Problem Reframe
- Alternative Approaches
- 10-Star Vision (one paragraph)
- Scope Mode Used
- Recommended Wedge (v1)
- Opt-in Expansions (if any)
- Explicit Non-Goals
- Next Step

## Example

### Problem Reframe

User does not need "photo upload" — they need a listing that converts in under 60 seconds with trustworthy visuals.

### Recommended Wedge (v1)

Auto-generate title and description from one photo + optional SKU lookup; manual upload only as fallback.
