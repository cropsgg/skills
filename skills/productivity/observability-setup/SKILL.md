---
name: observability-setup
description: "Define traces, metrics, logs, and query patterns following OpenTelemetry-oriented standards."
---

## When To Use

- When shipping a new service, worker, or critical client pathway without structured telemetry.
- After incidents where debugging took “too long due to missing signals,” correlation IDs, or queryability.
- When adding async boundaries: queues, workflows, cron, webhooks—places where stack traces disappear.
- Before scaling to higher throughput where “printf debugging” becomes non-viable.
- When consolidating tooling around **OpenTelemetry** exporters, collectors, and backend query workflows (including Honeycomb-style explorations).

Related: `/error-resilience-review` to ensure retries and partial failures are visible as first-class signals, not invisible loops.

Do not use this skill for logging secrets, full PII payloads, or unbounded high-cardinality labels that explode cost and violate privacy policies.

## Core Stance

- Instrument for questions you will actually ask during incidents, not vanity dashboards.
- **You cannot debug what you cannot see** — if a symptom is invisible, that is an engineering defect.
- Correlate signals across traces, metrics, and logs intentionally; do not assume humans will stitch them manually.
- Treat observability cost as a budgeted product: cardinality discipline matters.

## Research Backing

- **Honeycomb and OpenTelemetry observability standards** — modern practice centers on distributed tracing contexts, semantic conventions, and exploratory queries over high-dimensional events.
- **Production debugging research theme** — without queryable evidence of request lifecycles and dependency behavior, mean time to resolution grows superlinearly with system complexity.

## Process

1. **Name the service and boundaries**
   - Define service identity, deployment topology, and entrypoints (HTTP, gRPC, queue consumers, cron).
2. **Choose the signal mix**
   - Traces for latency breakdown; metrics for SLO burn rates; logs for exceptional detail—avoid triple-paying for the same datum.
3. **Define standard attributes**
   - `service.name`, `service.version`, `deployment.environment`, trace/span status; align with OpenTelemetry semantic conventions where applicable.
4. **Instrument critical paths first**
   - Auth, billing, data writes, external dependency calls, queue handlers—each span must have errors and latency.
5. **Design queries and dashboards as code**
   - SLO windows, burn alerts, saturation (CPU/mem), queue backlog, dependency error budgets—where supported.
6. **Logging policy**
   - Structured logs; correlation fields; rate limits for noisy errors; redaction lists for tokens and PII fields.
7. **Rollout plan**
   - Staging verification, sampling strategy (if needed), cost review for metric labels and high-cardinality fields.

## Operating Rules

- Be precise, technical, and critical.
- Do not skip complex areas because they are hard to verify; mock backends still need local verification scripts.
- Prefer evidence from code paths and validation output over intuition.
- Never encode user emails or free-text search strings as metric labels.
- Errors must be actionable: include operation name, dependency, and error classification—not only “Error: failed.”
- Keep alerts few and symptom-based; paging should mean human intervention is required.

## Output Format

Return a markdown report with these exact sections:

- Service / Component Scope
- Signal Strategy (traces/metrics/logs)
- Instrumentation Points (entrypoints + dependency calls)
- Required Fields (correlation, tenant, release)
- Dashboards / Query Library (named queries + intent)
- Alerting Policy (SLO-based vs threshold; paging rules)
- Privacy / Cost Review (cardinality, redaction)
- Rollout & Verification Checklist

## Example

### Instrumentation Points

- Wrap `POST /checkout` handler; create child spans for `payments.charge` and `inventory.reserve`.

### Required Fields

- `trace_id`, `span_id`, `org_id`, `release`, `feature_flags` (bounded dictionary, not raw user content).

### Dashboards / Query Library

- “Checkout p95 by `release` and `payments.provider`”; “DLQ depth by `queue` and `consumer_version`.”

### Alerting Policy

- Page on SLO burn for checkout success rate; ticket-only for elevated retries without user impact.
