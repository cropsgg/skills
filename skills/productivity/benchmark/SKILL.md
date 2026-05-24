---
name: benchmark
description: "Baseline Core Web Vitals (LCP, CLS, INP, TBT) and bundle sizes before and after every PR. Detect regressions >5% and flag them as blocking for performance-critical paths."
---

## When To Use

- Before opening or merging a PR that changes client-side code (JS bundles, CSS, image loading, rendering logic, font loading).
- When a user asks "did this slow anything down?" or "what's the performance impact?"
- As a pre-merge gate on performance-critical pages (landing, checkout, dashboard, search results).
- After a performance optimization to quantify the improvement with numbers.
- When the browser MCP or a headless browser (Lighthouse CLI, Playwright) is available.

Related: `/performance-optimization` for profiling and fixing regressions; `/canary` for post-deploy real-user monitoring; `/design-review` for visual performance impact of new UI.

Do not use this skill for backend-only PRs with no client-side impact. Do not use when no web frontend exists in the repo. Do not use when the change is purely textual (README, docs) or CI config.

## Core Stance

- Performance is a feature with measurable, comparable numbers. Every PR must answer: "this change moved LCP from Xms to Yms."
- Regressions aren't opinions — they're deltas. The threshold is 5%: >5% worse is a regression requiring justification; >5% better is an intentional improvement worth documenting.
- Lab data (Lighthouse) is the canary; field data (RUM, CrUX) is the truth. Lab catches regressions before they ship; field confirms real-user impact.
- Bundle size is performance's silent killer. A 10KB increase that adds 50ms to LCP on 3G is a regression even if Lighthouse lab data doesn't catch it.
- Run benchmarks on the same machine, same network conditions, same browser flags. Environment drift invalidates comparisons.

## Research Backing

- **Google Web Vitals** — Core Web Vitals (LCP, CLS, INP, TTFB) as standardized, user-centric performance metrics with defined thresholds: good/needs-improvement/poor.
- **W3C Web Performance Working Group** — standardized performance APIs (Paint Timing, Layout Instability, Event Timing) that Lighthouse and RUM tools build on.
- **Lighthouse Documentation** — lab data benchmarking methodology: throttled CPU/network simulation, median of 3 runs, identical flags for before/after comparison.
- **Chrome UX Report (CrUX)** — real-user field data for origin-level performance benchmarking; RUM tools (Sentry, Datadog RUM) for page-level field data.

## Process

1. **Define benchmark scope**
   - Identify pages to benchmark: landing page, key user flows, highest-traffic pages, pages touched by the PR diff.
   - If the PR touches shared components (header, footer, button library), benchmark pages that use those components.
   - For each page: one `URL` and one `label`.
   - Document the machine environment: OS, CPU throttling setting, network throttling setting.

2. **Run pre-change baseline**
   - Run Lighthouse CLI 3 times per page: `npx lighthouse <URL> --output json --chrome-flags="--headless --no-sandbox" --throttling-method=simulate --throttling.cpuSlowdownMultiplier=4 --output-path=/tmp/lh-pre-<label>-<n>.json`.
   - Extract from each run: `audits['largest-contentful-paint'].numericValue`, `audits['cumulative-layout-shift'].numericValue`, `audits['interaction-to-next-paint'].numericValue`, `audits['total-blocking-time'].numericValue`, `audits['speed-index'].numericValue`.
   - Take the median of 3 runs (not mean — Lighthouse is right-skewed).
   - Record bundle sizes: `du -sh dist/` or use bundler analyzer output for JS, CSS, image, font sizes. Record total + per-chunk.

3. **Apply the change**
   - If measuring a PR: check out the feature branch, build, and serve locally or via preview deploy.
   - Environment must be identical to baseline: same machine, same build flags, same throttling settings.

4. **Run post-change measurement**
   - Run Lighthouse 3 times per page with identical flags and URLs.
   - Record median values for LCP, CLS, INP, TBT, Speed Index.
   - Record post-change bundle sizes.

5. **Compare and classify**
   - For each metric per page: `delta = (post - pre) / pre * 100`.
   - Classification:
     - **Regression:** >5% worse (LCP/CLS/INP/TBT increased, bundle grew).
     - **Neutral:** within ±5%.
     - **Improvement:** >5% better.
   - Flag any metric crossing a vital threshold: LCP >2.5s (poor), CLS >0.1 (poor), INP >200ms (poor), TBT >200ms (poor).

6. **Report and recommend**
   - Report the before/after table with deltas.
   - If any regression >5% on a performance-critical page: flag as blocking — do not merge without justification or fix.
   - If regression on non-critical page: flag as non-blocking with recommendation.
   - If improvement: document the win for release notes.
   - If bundle size increased >10%: flag even if Lighthouse metrics are neutral (layered regression risk on slower connections).

## Operating Rules

- Always run 3 Lighthouse runs and take the median. Single runs are unstable.
- Always use the same throttling settings for before and after. `--throttling-method=simulate` is preferred for reproducibility.
- Never compare results from different machines or network environments.
- Bundle size increases >10% are always flagged regardless of Lighthouse metrics.
- If a metric crosses a vital threshold (from "good" to "needs improvement"), that is a blocking regression even if the delta is <5%.
- Mobile throttling is the default — benchmark for the most constrained target, not the developer's desktop.
- If Lighthouse is unavailable, use browser Performance API via `performance.getEntriesByType("navigation")` and `new PerformanceObserver()` — but flag as `[NO LIGHTHOUSE — browser API only]`.

## Output Format

Return a markdown report with these exact sections:

- Benchmark Scope (pages, labels, environment)
- Pre-Change Baseline (metrics per page, bundle sizes)
- Post-Change Measurement (metrics per page, bundle sizes)
- Delta Table (per metric: pre, post, delta%, classification)
- Vital Threshold Crossings (any metric went from good→poor?)
- Bundle Size Delta
- Verdict (PASS / BLOCKING / NON-BLOCKING FLAG)
- Recommended Action

## Example

### Delta Table — `/pricing` page

| Metric | Pre | Post | Delta | Classification |
|--------|-----|------|-------|----------------|
| LCP | 1.8s | 1.95s | +8.3% | **REGRESSION** |
| CLS | 0.02 | 0.02 | 0% | Neutral |
| TBT | 120ms | 135ms | +12.5% | **REGRESSION** |
| Speed Index | 2.1s | 2.3s | +9.5% | **REGRESSION** |

### Vital Threshold Crossings

LCP moved from "needs improvement" (1.8s) to "needs improvement" (1.95s) — no threshold crossed, but degrading within the same band.

### Bundle Size Delta

- JS: 145KB → 198KB (+36.5%) — hero animation library added.
- CSS: 45KB → 47KB (+4.4%).

### Verdict

**BLOCKING** — LCP regressed 8.3% and TBT regressed 12.5%. Bundle increased 36.5%. Recommend: lazy-load hero animation library, defer non-critical CSS.

### Recommended Action

Defer hero animation library to `requestIdleCallback`. Re-benchmark after fix to confirm LCP returns to baseline.
