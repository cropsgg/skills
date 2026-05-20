---
name: qa-report
description: "Report-only browser QA with structured findings and repro steps — no code fixes."
---

## When To Use

- Before release when the app has a runnable URL (local, staging, preview).
- When the user wants bugs found but will fix separately ("QA report only").
- After agent changes to UI flows, forms, or auth-gated pages.
- Complement to `/regression-check` for visual and interaction bugs tests miss.

Related: `/design-review` for visual polish; `/accessibility-audit` for WCAG; `/investigate` for deep dives on one bug.

Do not use this skill for fixing code — report only unless user explicitly switches to fix mode.

## Core Stance

- Test like a user: real clicks, real forms, real navigation — not code reading alone.
- Every finding needs severity, repro steps, and evidence (screenshot or DOM state).
- Cover critical paths first, then medium, then cosmetic.
- Fail closed: if IDE browser MCP is unavailable, state the limitation, deliver a manual test checklist, and ask the user for screenshots or DOM snapshots.

## Research Backing

- **ISO/IEC/IEEE 29119** — software testing concepts for structured test reporting.
- **Nielsen (1994)**, heuristic evaluation — systematic UI problem discovery.
- **Google Testing Blog** — exploratory testing complements automated suites.

## Process

1. **Define scope**
   - URL(s), auth requirements, browsers/viewports, critical user journeys.
2. **Browser setup**
   - Prefer IDE browser MCP: navigate, snapshot, interact, screenshot.
   - Import cookies or login flow if authenticated pages required.
   - Fallback: user-provided screenshots + manual step list if MCP unavailable.
3. **Execute journeys**
   - Happy path per critical flow
   - Error paths: invalid input, empty states, network offline if testable
   - Responsive: mobile + desktop widths
4. **Log findings**
   - Severity: Critical / High / Medium / Low / Cosmetic
   - Repro steps numbered; expected vs actual
5. **Health score**
   - 0–10 ship readiness for scoped area with one-line rationale.
6. **No fixes** — do not edit source files.

## Operating Rules

- Do not mutate production data destructively without user approval.
- Redact PII in screenshots and reports.
- Note console errors and failed network requests when tooling exposes them.
- Stop after 4 failed attempts on same step — report blocker.
- When browser MCP is missing, do not pretend pages were exercised — mark journeys as **not run** and list manual steps.

## Output Format

Return a markdown report with these exact sections:

- Test Scope and Environment
- Journeys Executed
- Health Score (0–10)
- Findings (by severity, each with repro + evidence)
- Console and Network Notes
- Blockers to Further Testing
- Recommended Next Steps

## Example

### Findings — High

**Checkout submit silently fails on empty CVV**
1. Add item to cart → Checkout
2. Leave CVV blank → Submit
3. **Expected:** inline validation error
4. **Actual:** spinner hangs, no error (see screenshot checkout-cvv.png)

### Health Score

6/10 — core browse works; checkout validation broken on payment step.
