---
name: performance-optimization
description: "Profile and optimize latency, render cost, bundles, and data access patterns with measurable baselines."
---

## When To Use

- When users report slowness, elevated TTFB, janky interactions, or rising server CPU/DB load tied to recent changes.
- After adding new data-fetching paths, heavy dependencies, or client-side animations/virtualization.
- Before scaling traffic, launching marketing spikes, or enabling a feature for large tenants.
- When bundle size budgets regressed in CI or Lighthouse scores dropped meaningfully.
- When code introduces obvious N+1 access patterns, refetch storms, or expensive synchronous work on hot paths.

Related: `/regression-check` to ensure perf refactors do not break behavior under tests.

Do not use this skill for micro-optimizing code that is not on a measured hot path; establish a baseline first.

## Core Stance

- Measure first. If you cannot name the metric, you are guessing.
- Treat perceived “clean code” as irrelevant unless it moves measurable cost.
- Attack **algorithmic** and **network** costs before cosmetic refactors.
- Keep optimizations reversible: isolate changes and pair each with a measurement.

## Research Backing

- **Vercel React Performance Rules** (57-rule framework) — establishes measurable frontend performance baselines for React-oriented applications.
- **Community performance-checker skills** — common patterns for **profiling**, **bottleneck detection**, and **N+1 query** elimination in agent-driven changes.

## Process

1. **Establish baseline metrics**
   - Frontend: Lighthouse (performance), Web Vitals (LCP/INP/CLS), React Profiler recording for interaction hotspots.
   - Backend: p50/p95 latency, throughput, error rate; DB query time and rows examined.
   - Record exact command, environment, dataset size (even approximate).
2. **Identify the dominant cost bucket**
   - Classify: render, bundle/download, CPU on server, IO wait, lock contention, cache misses, N+1 queries.
3. **Inspect data access patterns**
   - Trace ORM queries and raw SQL in `**/queries/**`, `**/repos/**`, `**/models/**`.
   - Look for loops dispatching queries; missing eager loading; unbounded `LIMIT` defaults; missing indexes for new filters.
4. **Inspect client rendering discipline**
   - Large lists: virtualization? memoization with stable props? expensive derived state recompute?
   - Image/media: sizing, lazy loading, format selection (repo-dependent).
5. **Propose optimizations ranked by ROI**
   - Prefer changes with smallest code risk per unit metric improvement.
6. **Re-measure and guard**
   - Add/extend a perf budget if the repo supports it (bundle analyzer gates, Lighthouse CI, query count assertions).
   - Ensure caching changes define invalidation; stale data is a correctness issue.

## Operating Rules

- Be precise, technical, and critical.
- Do not skip complex areas because they are hard to verify; use profiling tools or mark uncertainty.
- Prefer evidence from code paths and validation output over intuition.
- Never trade silent data corruption for speed; call out caching hazards explicitly.
- If you recommend denormalization, include consistency and backfill implications.
- Quantify expected impact as a range or “unknown” — avoid fake precision.

## Output Format

Return a markdown report with these exact sections:

- Baseline Metrics (with measurement method)
- Dominant Cost Bucket Analysis
- Hotspots (ranked)
- Bundle / Render / Network Decisions
- Data Access Patterns (including N+1 notes)
- Proposed Changes (ranked)
- Measurement Plan (before/after checklist)
- Expected Impact and Risk

## Example

### Baseline Metrics

- Lighthouse performance **72** (mobile emulation), LCP **3.8s** on `/dashboard`.
- API `GET /reports` p95 **980ms** at **N=200** accounts (staging).

### Hotspots

- `apps/web/components/ReportTable.tsx` renders **5k rows** without virtualization → main thread long tasks.
- `api/src/reports.ts` executes **1 + N** queries for account metadata.

### Proposed Changes

- Add windowing (`react-window`) + stabilize row props; re-run Lighthouse.
- Batch accounts query via `WHERE id = ANY($1)` and verify with SQL logging in dev.
