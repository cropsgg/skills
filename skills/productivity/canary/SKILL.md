---
name: canary
description: "Post-deploy monitoring loop: T+1min console errors and crash rate, T+5min error budget and p99 drift, T+15min final health vs baseline. Escalate to rollback on threshold breach."
---

## When To Use

- Immediately after a production deploy completes — invoked by `/land-and-deploy` or the user directly.
- After any change that touches client-side code (JavaScript bundles, CSS, asset paths, API response shapes consumed by UI).
- When the user says "watch the deploy" or "monitor for regressions."
- For high-risk deploys where a 15-minute canary window is the safety net before full traffic exposure.
- For deployments to canary environments, staging-then-production promotion, or gradual rollouts.

Related: `/land-and-deploy` automatically hands off to canary after merge+deploy; `/rollback-plan` defines the abort conditions that canary enforces; `/benchmark` for pre-deploy baseline capture; `/observability-setup` must be in place for metrics-based checks.

Do not use this skill when no production observability exists — run what checks are available (manual page loads, curl health endpoints) but flag all findings `[UNVERIFIED — no telemetry]`. Do not use for pre-merge testing (that's `/regression-check`).

## Core Stance

- The first 15 minutes post-deploy carry the deployment's entire health signal. Most production regressions surface within this window.
- Poll, don't wait. Active monitoring at defined intervals catches regressions before users report them.
- Compare every metric to the pre-deploy baseline. Absolute numbers are meaningless without the baseline.
- Threshold breach means escalate to rollback — not "let's watch another 5 minutes." Burn rate compounds.
- The canary window closes only when all checks pass at T+15. Partial passes are not good enough.

## Research Backing

- **Google SRE (Beyer et al., 2016)**, *Site Reliability Engineering*, Chapter 16 — canary analysis: gradual traffic shifting with automated health signal comparison; canary duration and sensitivity calibration.
- **Netflix Spinnaker**, *Automated Canary Analysis* — Kayenta-based canary analysis framework: metric comparison, statistical significance testing, automated pass/fail judgment from baseline vs canary data.
- **Honeycomb (2020)**, *Observability-Driven Development* — production signal closes the deploy loop; real-user traffic is the only true verification of a deploy's safety.
- **Forsgren et al. (2018)**, *Accelerate* — elite performers use deployment monitoring with automated rollback; change failure rate improves with canary practices.

## Process

1. **Capture pre-deploy baseline**
   - Before deploy OR immediately after deploy (use the 5-min window before the change reached production).
   - Record from monitoring dashboards or API: 5xx error rate (last 5min), p99 latency, crash/restart rate, page error rate (if frontend), console error count (if trackable).
   - If no dashboard: run `curl -s <health-endpoint>` and record response. Run `curl -s <key-page>` and check status code.

2. **T+0 — Deploy timestamp confirmed**
   - Record exact deploy timestamp from deployment pipeline (UTC).
   - Start the 15-minute canary clock.

3. **T+1min — Immediate surface checks**
   - Console errors: if frontend RUM/error tracking exists, query new error types in last 1 minute. Otherwise: manually load key pages and check browser console.
   - Crash rate: if crash reporting exists (Sentry, Crashlytics), query crash-free rate last 1min vs baseline.
   - 5xx spike: query 5xx count last 1min. Flag if >3× baseline rate or >5 absolute (whichever is higher).
   - **Gate:** if any check fails, pause the canary and escalate to the user with the specific failure. Do not wait for T+5.

4. **T+5min — Trend checks**
   - Error budget delta: query SLO error budget consumed in last 5min. Flag if burn rate would exhaust budget within the SLO window.
   - p99 latency: query last 5min vs baseline. Flag if >20% drift upward.
   - Page failure rate: if frontend, query 4xx/5xx on key page loads vs baseline.
   - Compare to baseline: every metric gets a before/after delta with direction.
   - **Gate:** if any check fails, invoke `/rollback-plan` immediately.

5. **T+15min — Final health check**
   - Repeat all T+5 checks.
   - Additional: check queue depth (if applicable), DB connection pool saturation, cache hit rate.
   - Compare cumulative 15min window to the equivalent 15min window pre-deploy.
   - **Gate:** all checks must pass for canary window to close.

6. **On threshold breach**
   - If any metric at T+1, T+5, or T+15 exceeds the defined threshold: escalate immediately.
   - Provide: which metric, current value, baseline, threshold, when it breached.
   - Recommended action: `/rollback-plan` (or direct revert if rollback plan already exists and is simple).
   - Do not wait for the next checkpoint — breach at T+1 means escalate at T+1.

7. **Close canary window**
   - If all checks pass at T+15: "Canary window closed. Deploy verified healthy."
   - Document: all checkpoints with metric values, baseline comparison, pass/fail per checkpoint.
   - Record the monitoring window for the deploy audit trail.

## Operating Rules

- Never skip a checkpoint. T+1, T+5, T+15 are mandatory intervals.
- Never extend the canary window because a check is "almost" breaching. Thresholds are thresholds.
- If a metric is unavailable, record it as `[UNAVAILABLE]` and flag the gap — do not assume it's fine.
- Baselines must be from the same environment and comparable time window (e.g., "5min before deploy" not "last Tuesday").
- Page the user on any threshold breach — the agent has no authority to decide a breach is a false positive.
- Console errors must be deduplicated — 500 instances of the same error is one finding with count, not 500 findings.
- Keep the T+1 check fast — this is not a deep investigation, it's a smoke test. Save root-cause analysis for after escalation.

## Output Format

Return a markdown report with these exact sections:

- Deploy Timestamp (UTC)
- Baseline Captured (metrics + values)
- T+1 — Surface Check (errors, crash, 5xx — pass/fail per metric)
- T+5 — Trend Check (error budget, p99, page failures — with before/after delta)
- T+15 — Final Check (all T+5 metrics + queue/saturation/cache)
- Threshold Breaches (metric, value, baseline, threshold, timestamp — or "none")
- Canary Verdict (CLOSED / ESCALATED)
- Rollback Link (if escalated)
- Recommended Next Step

## Example

### Baseline Captured

| Metric | Value |
|--------|-------|
| 5xx rate (5min) | 0.02% (3 errors) |
| p99 latency | 340ms |
| Crash rate | 0.01% |
| Page error rate | 0.1% |

### T+1 — Surface Check

| Check | Result | Detail |
|-------|--------|--------|
| Console errors | PASS | 0 new error types |
| Crash rate | PASS | 0.01% (unchanged) |
| 5xx spike | PASS | 2 errors (baseline: 3) |

### T+5 — Trend Check

| Metric | Baseline | Current | Delta | Threshold | Status |
|--------|----------|---------|-------|-----------|--------|
| 5xx rate | 0.02% | 0.03% | +0.01% | >0.06% | PASS |
| p99 latency | 340ms | 365ms | +7.4% | >408ms | PASS |
| Page error rate | 0.1% | 0.1% | 0% | >0.3% | PASS |

### Canary Verdict

CLOSED — all checks passed at T+15. Deploy verified healthy.

### Recommended Next Step

Canary window closed at 14:50 UTC. No further monitoring required. Document saved to deploy audit trail.
