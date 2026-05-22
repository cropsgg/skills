---
name: incident-commander
description: >-
  Active incident response protocol for production outages. Provides severity
  classification, communication templates, rollback decision trees, and
  post-incident report generation. Distinguishes between incident response
  (during) and postmortem (after). Enforces structured command-and-control to
  prevent panic-driven fixes.
---

## When To Use

- Alert fires: P99 latency > threshold, error rate spike, disk full, memory OOM.
- User reports: "the site is down", "payments are failing", "login is broken."
- Deployment correlates with a metric anomaly (within 15 minutes).
- Agent is asked to "fix production" or "investigate the outage."

Related: `/incident-postmortem` for after-action review; `/rollback-plan` for pre-planned rollback procedures; `/investigate` for non-urgent debugging.

Do not use this skill for minor bugs, pre-production issues, or planned maintenance. This is for active production incidents only.

## Core Stance

- When production is down, the instinct to fix it immediately kills. It leads to fixes that make things worse, loss of forensic evidence, communication chaos, and burnout.
- Incident response is a military operation: there is a commander, there are phases, there are rules of engagement, and there is a defined end state.
- Evidence preservation comes before fixing. Communication comes before debugging. Rollback comes before hotfix.

## Research Backing

- **Allspaw & Robbins (2010)**, *Etsy's Debriefing Facilitation Guide* — Blameless post-incident process and structured communication during outages are critical to learning and reliability.
- **Dekker (2011)**, *Drift into Failure* — Complex systems fail through normal work, not single causes; preserving evidence and resisting panic-driven fixes are essential.
- **Google SRE (2016)**, *Site Reliability Engineering* — Severity classification, commander role, and structured response protocols reduce MTTR and prevent secondary incidents.

## Process

### Phase 1: Triage (First 2 Minutes)
Do not attempt a fix. Classify severity:
- **SEV1**: Complete outage, revenue-critical path down, data loss in progress.
- **SEV2**: Major feature degraded, workaround exists but is painful.
- **SEV3**: Minor feature broken, no workaround needed, low user impact.
- **SEV4**: Cosmetic, monitoring gap, no user impact.

Determine blast radius (which users, regions, data), trigger (last deployment, config change, traffic spike, dependency failure), and notify on-call channel: `SEV[X] | [System] | [Symptom] | [Trigger suspected] | Commander: [name/agent]`.

### Phase 2: Evidence Preservation (Minutes 2–5)
Before touching anything: capture error logs (last 100 lines), snapshot DB metrics (active connections, replication lag, slow queries), snapshot app metrics (memory, CPU, request queue depth), note deployment SHA (`git rev-parse HEAD`). If data corruption suspected, snapshot affected data (read-only dump) before any write.

Document in `INCIDENT_YYYYMMDD_HHMM.md`: severity, blast radius, trigger, evidence links.

### Phase 3: Decision Tree (Minutes 5–10)
Choose ONE path based on severity and trigger:

**Path A: Rollback (Preferred for SEV1/SEV2)**
- Condition: Incident started within 30 minutes of deploy or config change.
- Action: Rollback to previous stable version. Do not debug the new version.
- Verify: Confirm rollback SHA is last known good deployment.
- Risk: Data written since deploy may be incompatible — check migration reversibility.

**Path B: Mitigation (If no recent deploy)**
- Condition: Infrastructure failure, dependency outage, traffic spike.
- Action: Scale up replicas, enable circuit breaker, redirect traffic to healthy region, disable failing feature via flag.
- Verify: Confirm mitigation reduced error rate within 5 minutes.

**Path C: Hotfix (Last Resort)**
- Condition: Rollback impossible (irreversible migration), mitigation ineffective, root cause known with high confidence.
- Action: Minimal fix, deploy via emergency pipeline (keeps security scan, skips non-required checks).
- Requirement: Two-person rule — another engineer reviews the fix before deploy.

### Phase 4: Communication Rhythm
- SEV1: Update every 5 minutes in incident channel.
- SEV2: Update every 15 minutes.
- SEV3/4: Update every 30 minutes or at resolution.
- Template: `[HH:MM] Status: [investigating/identified/mitigating/monitoring/resolved]. Action: [current step]. ETA: [time or unknown].`
- Stakeholder update: every 30 minutes for SEV1, plain language, no jargon.

### Phase 5: Monitoring (15 Minutes)
After error rate returns to baseline: do not declare resolved immediately. Watch for secondary failures (cascading effects, cache stampede, DB connection pool exhaustion). If metrics stay clean for 15 minutes, declare: `RESOLVED | [time] | Monitoring complete.` If metrics degrade, re-classify and restart.

### Phase 6: Handoff to Postmortem
Append timeline of every action, why each path was chosen, data impact assessment, customer communication sent. Schedule postmortem within 24 hours (SEV1) or 48 hours (SEV2). Trigger `/incident-postmortem`.

## Operating Rules

- If incident open >1 hour, rotate commander. Fresh eyes prevent tunnel vision.
- If fix attempt fails twice, escalate to Path A (rollback) or Path B (mitigation). No third fix attempt.
- If data corruption is possible, stop all writes to affected store until data engineer assesses.
- Never declare resolved without 15-minute clean monitoring window.
- No uncommitted hotfix code remains in production — merge to main via PR after resolution.

## Output Format

Primary artifact: `INCIDENT_YYYYMMDD_HHMM.md` containing triage assessment, evidence links, decision tree path chosen, timeline of actions, resolution declaration, and postmortem scheduling.

## Example

**Alert**: P99 latency 4500ms (baseline: 200ms). Deploy v1.2.3 at 14:32 UTC.

**Agent**: "SEV1 | User API | P99 4500ms | Deploy v1.2.3 at 14:32 | Commander: agent. Triage: all regions affected. Evidence preserved: logs + DB metrics + SHA. Trigger: deploy within 30min. Decision: Path A — Rollback to v1.1.9. Rollback initiated."
