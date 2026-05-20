---
name: to-prd
description: "Synthesize conversation context into a PRD and file it as a GitHub issue."
---

## When To Use

- After `/requirements-grill`, `/office-hours`, or `/plan-ceo-review` when decisions exist in chat but not in a durable spec.
- When the user asks to "write the PRD", "capture the spec", or "create the ticket."
- Before `/to-issues` to decompose work from a single source of truth.

Related: `/to-issues` for vertical-slice breakdown; `/domain-context` for glossary attachment.

Do not use this skill for empty scope — run `/requirements-grill` first if context is missing.

## Core Stance

- Synthesize **what was already decided** in the thread; do not invent requirements.
- PRD is concise — scannable in 3 minutes.
- Unresolved items go in Open Questions, not buried in prose.
- File as GitHub issue when `gh` is available unless user prefers local markdown only.

## Research Backing

- **Cohn (2004)**, *User Stories Applied* — structured requirements for iterative delivery.
- **IEEE 29148:2018** — requirements engineering content for software specifications.
- **Evans (2003)**, *Domain-Driven Design* — explicit ubiquitous terms in specs.

## Process

1. **Harvest decisions** from conversation — goals, non-goals, constraints, personas.
2. **Draft PRD sections**
   - Summary (2–3 sentences)
   - Problem and users
   - Goals and non-goals
   - Acceptance criteria (testable bullets)
   - UX notes (if applicable)
   - Technical constraints
   - Open questions
3. **Review with user** — one confirmation pass if ambiguous items remain.
4. **Publish**
   - Option A: `gh issue create --title "PRD: …" --body-file …`
   - Option B: write `docs/prd/<slug>.md` and link in issue
5. **Return link or path**

## Operating Rules

- Mark assumptions explicitly with `[ASSUMPTION]`.
- Do not include implementation code in PRD.
- Acceptance criteria must be verifiable — no "works well."
- Use repo issue templates if they exist.

## Output Format

Return a markdown report with these exact sections:

- PRD Summary
- Full PRD Body (markdown)
- Issue URL or File Path
- Open Questions
- Recommended Next Step

## Example

### Issue URL

https://github.com/org/repo/issues/101

### Recommended Next Step

Run `/to-issues` against issue #101 for vertical slices.
