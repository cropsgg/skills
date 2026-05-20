---
name: to-issues
description: "Break a plan or PRD into independently grabbable vertical-slice GitHub issues."
---

## When To Use

- After a PRD or approved plan exists (`/to-prd`, design doc).
- When work is too large for one PR and needs parallelizable tickets.
- Before sprint planning or agent parallelization across issues.

Related: `/triage` for incoming bug/issue hygiene; `/ship` per issue when complete.

Do not use this skill for decomposing work without approved scope or acceptance criteria.

## Core Stance

- **Vertical slices** deliver user-visible or API-visible value per issue — not "layer tickets" (DB only, UI only).
- Each issue is independently mergeable when possible.
- Dependencies explicit in issue body or blocked-by links.
- Sizing: prefer 1–3 day human effort per issue; split if larger.

## Research Backing

- **Cohn (2004)**, *User Stories Applied* — INVEST criteria for independent, valuable stories.
- **Beck (2000)**, *Extreme Programming Explained* — small releases and incremental delivery.
- **Forsgren et al., DORA** — smaller batch sizes improve delivery stability.

## Process

1. **Read source** — PRD issue, design doc, or pasted plan.
2. **Identify slices**
   - Order by dependency; flag blocking relationships.
   - Each slice: title, acceptance criteria, test notes.
3. **Draft issues** (markdown bodies)
   - Context link to PRD
   - Acceptance criteria (checkboxes)
   - Out of scope for this slice
   - Definition of done
4. **Create via `gh issue create`** (or output bodies for manual create)
5. **Summary table** — issue #, title, depends on

## Operating Rules

- Do not create issues without user approval when bulk-creating (>3).
- Label consistently if repo defines labels (feature, chore, etc.).
- Avoid duplicate issues — search existing open issues first with `gh issue list`.
- Include rollback/feature-flag notes on risky slices.

## Output Format

Return a markdown report with these exact sections:

- Source Document
- Issue Breakdown Table (#, title, dependencies)
- Issue Bodies (or links)
- Suggested Implementation Order
- Risks Spanning Multiple Issues

## Example

### Issue Breakdown Table

| # | Title | Depends on |
|---|-------|------------|
| 102 | Discount API endpoint | — |
| 103 | Checkout UI applies discount | 102 |

### Suggested Implementation Order

102 → 103 → `/regression-check` on full checkout path
