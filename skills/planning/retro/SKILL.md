---
name: retro
description: "Weekly engineering retrospective from git history and quality signals."
---

## When To Use

- End of week or sprint for team or solo reflection.
- When the user asks "what did we ship?" or "weekly retro."
- After `/health-check` to attach metrics to narrative.

Related: `/health-check` for scores; `/incident-postmortem` for single incidents.

Do not use this skill for performance reviews of individuals in a punitive framing.

## Core Stance

- Data-informed, blameless, actionable.
- Celebrate shipped work; name systemic friction, not people.
- Trends matter more than one bad day.
- Output: 3 keep, 3 improve, 3 action items max.

## Research Backing

- **Kerth (2001)**, *Project Retrospectives* — structured reflection for team learning.
- **DORA metrics** — delivery and stability signals for engineering performance.
- **Google SRE** — blameless postmortem culture extended to routine retros.

## Process

1. **Time window**
   - Default: last 7 days; user can override.
2. **Git analysis**
   - `git log --since=… --oneline --no-merges`
   - Authors, files hot spots, revert/fix commits
3. **Quality signals**
   - Run `/health-check` when no recent score exists in the thread; otherwise cite the last score
   - Open P0/P1 issues count via `gh issue list` when `gh` is available
4. **Themes**
   - What shipped (features, fixes)
   - What hurt (incidents, flakes, review delays)
   - Debt accumulated or paid down
5. **Actions**
   - Max 3 concrete process or code improvements with owners

## Operating Rules

- Redact sensitive commit messages if user requests.
- Solo dev: frame as personal retro, same structure.
- Do not invent metrics — mark unknowns.
- Link issues/PRs by number when available.

## Output Format

Return a markdown report with these exact sections:

- Period
- Shipped Highlights
- Metrics Snapshot (commits, PRs, health score if known)
- What Went Well
- What Didn't Go Well
- Themes
- Action Items (owner, due)
- Optional: Save path `docs/retros/YYYY-MM-DD.md`

## Example

### Action Items

| Action | Owner | Due |
|--------|-------|-----|
| Stabilize checkout e2e flake | @eng | Fri |
| Document discount rules in CONTEXT.md | @eng | Wed |

### Metrics Snapshot

- 47 commits, 6 PRs merged, health 8.2/10
