---
name: error-resilience-review
description: "Review failure modes, retries, timeouts, idempotency, and graceful degradation paths."
---

## When To Use

- When adding or modifying outbound HTTP calls, message consumers, background jobs, or scheduled tasks.
- When introducing retries, backoff, circuit breakers, bulkheads, hedged requests, or parallel fan-out.
- When user-facing flows depend on partially available dependencies (feature flags, third-party APIs, identity providers).
- After incidents where “cascading failures”, “retry storms”, or “duplicate processing” appeared in timelines.
- When expanding multi-step workflows across services without a clear compensating transaction story.

Related: `/regression-check` for chaos/adversarial tests and fault-injection coverage where the repo supports it.

Do not use this skill for substituting a dedicated SRE incident review; it focuses on **code-level** resilience patterns in the change set.

## Core Stance

- Assume dependencies fail **slowly** and **partially**, not only with clean HTTP 500s.
- Treat unbounded retries as a defect class: they amplify outages.
- Require idempotency keys where at-least-once delivery is possible.
- Prefer explicit degradation (cached read, stale UI, partial results) over hard failure when product policy allows.

## Research Backing

- **Agent under-specification of error handling (2024–2025)** — a recurring research-and-practice theme: automated changes often omit timeouts, cancellation, and partial-failure behavior unless forced by explicit review criteria.
- **Circuit breaker, retry, and fallback pattern standards (Netflix, AWS)** — industry patterns for isolating failures, shaping retry behavior, and preventing client overload during dependency degradation.

## Process

1. **Inventory external interactions in the diff**
   - List each dependency: DB, cache, queue, HTTP API, object storage, SMTP, LLM gateway, search.
2. **Classify delivery semantics**
   - At-most-once vs at-least-once vs effectively-once (desired vs actual).
3. **Check timeout and cancellation**
   - Every outbound call should have bounded time and a defined cancellation path where the runtime supports it.
   - Watch for hidden retries inside SDK defaults.
4. **Review retry policy**
   - Idempotency: safe on POST? use idempotency keys, dedupe tables, unique constraints.
   - Backoff + jitter; cap attempts; classify non-retryable errors (400-level business errors).
5. **Review resource protection**
   - Concurrency limits per dependency; bulkheads for shared pools; shed load when saturated.
6. **Verify observability hooks**
   - Errors must be attributable: dependency name, operation, correlation id; avoid logging secrets/PII payloads at full volume.

## Operating Rules

- Be precise, technical, and critical.
- Do not skip complex areas because they are hard to verify; mark unknown SDK behavior explicitly.
- Prefer evidence from code paths and validation output over intuition.
- Do not recommend infinite retries “for reliability.”
- If you add fallbacks, specify staleness limits and user-visible disclosures where required.
- Separate **correctness** bugs (duplicate writes) from **availability** tuning (timeouts).

## Output Format

Return a markdown report with these exact sections:

- Dependency Inventory (new/changed)
- Failure Modes (timeout, partial response, backoff, duplicate delivery)
- Delivery Semantics (intended vs implemented)
- Retry / Timeout / Cancellation Policy Review
- Idempotency and Deduplication Strategy
- Degradation and Fallback Behavior
- Observability Hooks (signals, fields, tracing)
- Required Code Changes (ranked)

## Example

### Failure Modes

- Webhook processor retries `500` from partner API with no max delay → risk of retry storm during outages.

### Idempotency and Deduplication Strategy

- Add `processed_events` unique constraint on `(provider, event_id)`; return `200` on duplicates.

### Observability Hooks

- Emit `partner_api_latency_ms` tagged by `route`; log `event_id` only (not full payload).
- Add structured field `retry_attempt` capped at max tries so dashboards can spot retry storms quickly.

### Required Code Changes (ranked)

1. Cap retry budget with jittered exponential backoff.
2. Add idempotent event ingestion with a unique `(provider, event_id)` constraint.
