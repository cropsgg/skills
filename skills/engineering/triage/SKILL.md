---
name: triage
description: "Triage issues through labels, priority, and state with consistent hygiene."
---

## When To Use

- When the issue backlog is noisy or unlabeled.
- After `/to-issues` created many tickets needing prioritization.
- Incoming bugs from `/qa-report` need severity and owner assignment.
- Weekly hygiene on open GitHub issues.

Related: `/to-issues` for creation; `/investigate` for deep bug work.

Do not use this skill for closing issues without user approval or rewriting product scope.

## Core Stance

- Triage is **classification and routing**, not fixing.
- Every issue gets: type, priority, reproduction status, and next action.
- Use repo label conventions when they exist; propose minimal set if missing.
- Duplicate issues merged or linked, not left parallel.

## Research Backing

- **Kerzner (2017)**, *Project Management* — prioritization frameworks for constrained capacity.
- **ITIL 4** — incident vs problem vs change categorization.
- **GitHub Docs — Issue Triage** — community practices for open-source backlog management.

## Process

1. **Load backlog**
   - `gh issue list --state open --limit 50` (adjust filters)
2. **Per issue classify**
   - Type: bug / feature / chore / question / security
   - Priority: P0–P3 (define: P0 = prod down)
   - Repro: confirmed / needs-info / cannot-reproduce
3. **Apply labels** via `gh issue edit` when user approves bulk updates
4. **Detect duplicates** — link related issues
5. **Route**
   - Needs-info → comment template requesting repro
   - Security → flag for `/security-audit`
   - Stale → close or ping with policy
6. **Summary table** for user

## Operating Rules

- Do not close issues without explicit user rule or template policy.
- Comment templates polite and specific — no boilerplate walls.
- Respect `CONTRIBUTING.md` triage rules if present.
- Batch label changes; show diff before applying when >5 issues.

## Output Format

Return a markdown report with these exact sections:

- Backlog Scope (filter used)
- Triage Summary (counts by priority/type)
- Issue Actions Taken (number, action)
- Issues Needing User Decision
- Label Convention Used
- Recommended Next Steps

## Example

### Triage Summary

- P0: 1 (checkout down)
- P1: 4
- Unlabeled → labeled: 12

### Issue Actions Taken

- #88 — labeled `bug`, `P1`, comment requesting HAR file
