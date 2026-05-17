---
name: rollback-plan
description: "Define rollback, blast-radius limits, and verification for high-risk releases and migrations."
---

## When To Use

- Before deployments involving irreversible migrations, large backfills, auth changes, or billing logic changes.
- When enabling a feature flag that increases write volume or changes money movement semantics.
- When replacing a critical dependency version with breaking behavior (SDK major bumps).
- When canary deploys are possible but rollback semantics are unclear (schema forward-only, cached clients).
- When incident response requires a rehearsed rollback rather than improvisation.

Related: `/observability-setup` to ensure signals exist to validate canary health and trigger rollback decisions.

Do not use this skill for approving the release of unsafe migrations; rollback plans complement correctness work, they do not replace it.

## Core Stance

- If rollback is impossible, say so explicitly and demand safer rollout mechanics (feature flags, dual-write, shadow reads).
- Optimize for **time-to-safe-state**, not “perfect revert.”
- Treat partial failures as normal; define decision points with objective metrics.
- Communication is part of rollback—silent rollbacks create secondary incidents.

## Research Backing

- **Site Reliability Engineering practices (Google, 2017)** — emphasize controlled rollouts, operational readiness, and measurable launch criteria.
- **Blue-green deployment and canary release research / practice** — progressive exposure with traffic shifting and automated promotion/rollback gates.

## Process

1. **Define blast radius**
   - Users affected, data domains touched, financial/legal implications, dependency fan-out.
2. **List rollout steps**
   - Build, migrate, deploy, enable flag, cache warm, client refresh—each with an owner and max duration.
3. **Define health signals**
   - Error budgets: p95 latency, error rate, saturation, queue depth, business KPI proxies (where available).
4. **Write rollback triggers**
   - Automatic thresholds where supported; human triggers where judgment is required—both must be explicit.
5. **Write rollback procedure**
   - Version rollback, flag disable, traffic shift, migration remediation (forward-fix vs backfill), cache invalidation.
6. **Data safety checks**
   - Identify irreversible steps; plan backups, replay queues, idempotency keys, and reconciliation jobs.
7. **Comms plan**
   - Who is notified, what customers see, status page policy, internal channels, incident commander role if needed.

## Operating Rules

- Be precise, technical, and critical.
- Do not skip complex areas because they are hard to verify; mark unknown dependencies clearly.
- Prefer evidence from code paths and validation output over intuition.
- Never promise “one-click rollback” unless every layer supports it (code, schema, caches, clients).
- If rollback requires manual SQL, include pre-written statements and safety checks—still treat as high risk.
- Practice the plan in staging when stakes are non-trivial.

## Output Format

Return a markdown report with these exact sections:

- Context and Blast Radius
- Preconditions (access, feature flags, migrations)
- Rollforward Plan (ordered steps)
- Health Signals and Thresholds
- Rollback Triggers (auto/human)
- Rollback Steps (ordered, reversible vs irreversible)
- Data Considerations (backup, reconciliation, idempotency)
- Verification After Rollback (functional + observability)
- Communication Checklist

## Example

### Rollback Triggers

- Auto: `5xx` rate **> 1%** for **5 minutes** on `/checkout/**` in canary.

### Rollback Steps

- Disable `ENABLE_NEW_PRICING` flag; shift traffic to prior release; invalidate `pricing:*` cache keys.

### Data Considerations

- Migration adds column only (expand) — rollback does **not** drop column; feature flag gates reads instead.

### Verification After Rollback

- Confirm KPI returns to baseline; replay DLQ events if any were paused; post internal summary with timeline.
