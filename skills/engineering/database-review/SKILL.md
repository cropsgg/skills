---
name: database-review
description: "Review migrations, schema safety, transactional boundaries, indexes, and query health."
---

## When To Use

- When adding or altering tables, columns, constraints, indexes, views, or materialized caches backed by a database.
- When introducing backfills, batch updates, online schema changes, or expand/contract migrations.
- When ORM queries change in hot paths (new filters, joins, eager-loading behavior, “quick fixes” in repositories).
- Before multi-tenant or soft-delete features that risk cross-tenant leakage via query omissions.
- When production exhibits lock contention, slow queries, replication lag, or migration-induced downtime risk.

Related: `/regression-check` for migration rollback drills and integration tests covering data invariants.

Do not use this skill for performing live production operations; produce review artifacts and recommended commands, not executed DBA actions unless explicitly authorized.

## Core Stance

- Treat schema changes as distributed systems events: ordering, partial failure, and rollback matter.
- Assume migrations will run twice (retries) and concurrently (multiple workers) unless proven otherwise.
- Prefer additive changes first; destructive changes require expand/contract discipline.
- Query plans are part of your interface; verify with realistic data sizes.

## Research Backing

- **PlanetScale database skill patterns** — emphasize **schema safety**, **migration review**, and **query optimization** as first-class release risks.
- **Schema drift and data integrity in automated code generation** — treat codegen/ORM churn as a source of silent mismatch between code assumptions and stored reality.

## Process

1. **Classify migration strategy**
   - Online vs offline; expand/contract phases; feature flags for dual-write/dual-read if needed.
2. **Review DDL for safety**
   - Dangerous ops: blocking `ALTER`, full-table rewrites, adding `NOT NULL` without backfill, uniqueness changes under load.
   - **Postgres/MySQL specifics:** lock modes, `VALIDATE CONSTRAINT`, shadow tables—use what matches the engine.
3. **Validate data invariants**
   - Foreign keys, uniqueness, check constraints, enum domains; ensure application code respects partial indexes.
4. **Review transactional boundaries**
   - Unit-of-work scope for multi-step updates; idempotency of retried jobs touching the same rows.
5. **Inspect query changes**
   - Look for N+1, missing indexes for new predicates, unstable `ORDER BY`, unbounded scans, `SELECT *` in hot paths.
6. **Plan verification**
   - Migration dry-run on snapshot; `EXPLAIN (ANALYZE, BUFFERS)` in staging with representative datasets—only where permitted.
7. **Define rollback**
   - What is reversible without data loss; which steps require compensating transactions instead of DDL rollback.

## Operating Rules

- Be precise, technical, and critical.
- Do not skip complex areas because they are hard to verify; mark as “needs DBA/statistics review.”
- Prefer evidence from code paths and validation output over intuition.
- Never recommend “just run the migration at night” as the only mitigation without measuring duration/locks.
- If you add soft deletes, confirm **every** query path applies the predicate—or use DB-level enforcement where possible.
- Separate **correctness** (data loss) from **performance** (latency) findings.

## Output Format

Return a markdown report with these exact sections:

- Migration Overview (intent, scope)
- DDL / ORM Change Review (risk-rated)
- Data Backfill / Cutover Plan
- Integrity Constraints and Invariants
- Query Health (plans, indexes, access patterns)
- Operational Risks (locks, replication, disk)
- Rollback / Recovery Plan
- Verification Checklist (commands, environments)

## Example

### DDL / ORM Change Review

- Adding `NOT NULL` to `users.display_name` without backfill → migration failure or table rewrite risk.

### Query Health

- New admin search uses `WHERE lower(email) LIKE` without functional index → sequential scan at scale.

### Rollback / Recovery Plan

- Expand phase adds nullable column + backfill job; contract phase enforces `NOT NULL` only after **100%** populated and verified.

### Verification Checklist

- Run migration against anonymized prod-sized dump; measure lock time; run integration tests for user signup and profile update paths.
