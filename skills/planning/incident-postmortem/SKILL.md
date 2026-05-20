---
name: incident-postmortem
description: "Blameless postmortem with timeline, root cause, and actionable follow-ups."
---

## When To Use

- After production incidents: outage, data corruption, security event, major SLA miss.
- When the user asks for postmortem, incident review, or "what happened?"
- Before closing a severe-severity ticket.

Related: `/investigate` for active debugging; `/rollback-plan` when deploy rollback was involved; `/observability-setup` for missing telemetry gaps.

Do not use this skill for minor bugs with no production impact or hypothetical tabletop exercises without incident data.

## Core Stance

- **Blameless:** focus on systems and process, not individuals.
- Timeline first — facts before interpretation.
- Root cause is a chain, not a single person or typo.
- Every action item has an owner and due date or "track in issue #."

## Research Backing

- **Google SRE — Postmortem Culture** — blameless postmortems and incident review practice.
- **Allspaw (2012)**, *Web Operations* — learning from failure in complex systems.
- **ISO/IEC 27035** — information security incident management lifecycle.

## Process

1. **Metadata**
   - Incident ID, severity, duration, services affected, customer impact quantified.
2. **Timeline (UTC)**
   - Detection, escalation, mitigations, resolution — cite logs/alerts/tickets.
3. **Impact**
   - Users, revenue, data, SLA, regulatory if applicable.
4. **Root cause analysis**
   - 5-whys or fault tree; distinguish trigger vs contributing factors.
5. **What went well / what went poorly**
6. **Action items**
   - Prevent recurrence, improve detection, improve response — each with owner.
7. **Publish**
   - Write `docs/postmortems/YYYY-MM-DD-slug.md` or user path; optional `gh issue create` per action item.

## Operating Rules

- Do not speculate without labeling `[UNVERIFIED]`.
- Link to dashboards, commits, and PRs that mitigated or caused.
- Security incidents: redact secrets and PII in published doc.
- User must approve before posting externally.

## Output Format

Return a markdown report with these exact sections:

- Incident Summary
- Impact
- Timeline
- Root Cause and Contributing Factors
- What Went Well
- What Went Poorly
- Action Items (owner, due, tracking link)
- Postmortem Document Path

## Example

### Root Cause

Stale cache TTL after deploy #8821 served old price rules for 14 minutes; no cache-bust on config change.

### Action Items

| Action | Owner | Due |
|--------|-------|-----|
| Bust cache on config deploy | @eng | 2026-05-25 |
| Alert on price mismatch | @sre | 2026-06-01 |
