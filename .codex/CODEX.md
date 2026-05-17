# Project context

This file is a template for agents that read Markdown instructions from `CODEX.md` in-repo or beside the tool configuration. Customize for your team.

## AI Skills Library

Use these skills for all production engineering work on this codebase.

Available slash commands (invoke exactly as written):

- `/self-audit` — Audit session changes for bugs, runtime errors, spec drift, and incomplete work.
- `/security-audit` — OWASP-aligned security review: trust boundaries, auth, validation, insecure defaults.
- `/performance-optimization` — Measure and improve latency, renders, bundles, and data access.
- `/regression-check` — Run and interpret tests; catch unintended side effects before merge.
- `/accessibility-audit` — WCAG-oriented UI review with automated checks and manual follow-ups.
- `/api-contract-validate` — Align HTTP/JSON (or equivalent) implementations with schemas and types.
- `/error-resilience-review` — Timeouts, retries, idempotency, degradation, and failure visibility.
- `/dependency-audit` — Lockfiles, upgrades, transitive risk, and known vulnerability posture.
- `/database-review` — Migrations, constraints, indexes, queries, and operational risk.
- `/docs-sync` — Keep docs, ADRs, and runbooks aligned with shipped behavior.
- `/rollback-plan` — Rollback, blast radius, verification, and comms for risky releases.
- `/observability-setup` — Traces, metrics, logs, and query patterns for production debugging.

**Cadence:** run `/self-audit` after substantive implementation. Run `/regression-check` before every commit when tests exist. Run `/security-audit` before merging changes that touch trust boundaries or user data.

See the repository README for methodology; skill bodies live under `skills/`.
