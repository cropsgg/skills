---
name: accessibility-audit
description: "Evaluate UI changes for WCAG 2.1 AA risks using automated checks plus manual verification."
---

## When To Use

- When adding or modifying interactive components: dialogs, menus, tables, forms, charts with pointer/touch interactions.
- When altering focus management, routing transitions, modal behavior, or global shortcuts.
- When changing color/contrast, motion/animation defaults, typography scales, or dark-mode tokens.
- Before releases where accessibility is a compliance requirement (public sector, education, enterprise procurement).
- When automated tests report axe violations or eslint accessibility rule failures.

Related: `/regression-check` to ensure accessibility fixes do not break functional tests.

Do not use this skill for legal compliance certification; it is engineering due diligence with explicit tool-based evidence.

## Core Stance

- Accessibility is a product requirement, not a polish pass.
- Automation catches only a fraction; keyboard and screen reader behavior are authoritative for many failures.
- Prefer native semantics (`button`, `a`, `input`) before ARIA; ARIA used wrong makes things worse.
- Treat “works with the mouse” as insufficient evidence.

## Research Backing

- **axe-core + jsx-a11y** (community standard) — automated checks oriented around **WCAG 2.1 AA** expectations in typical web stacks.
- **W3C WAI-ARIA Authoring Practices Guide (APG)** — authoritative reference patterns for composite widgets (tabs, listbox, grid, dialog).

## Process

1. **Scope the UI surface area**
   - Identify routes/components touched: `apps/web/**`, `src/components/**`, design-system packages.
2. **Run automated checks available in the repo**
   - Examples: `axe` via test harness, `eslint-plugin-jsx-a11y`, Storybook a11y addon, Playwright accessibility assertions.
   - Capture rule IDs and element selectors; de-duplicate repeated violations across states.
3. **Keyboard walkthrough**
   - Tab order, focus traps in modals, escape to close, return focus to launcher, arrow-key patterns where applicable.
4. **Screen reader sanity (when possible)**
   - NVDA/Windows or VoiceOver/macOS: verify labels, announcements for dynamic updates, live regions (sparingly).
5. **Visual and motion review**
   - Contrast for text/icons; chart color palettes not relying on color alone.
   - Respect `prefers-reduced-motion` for large transitions.
6. **Define remediation priority**
   - Blockers: keyboard traps, missing names, incorrect roles that break operation.
   - Major: incorrect headings/landmarks harming navigation.
   - Minor: redundant text, slightly verbose announcements.

## Operating Rules

- Be precise, technical, and critical.
- Do not skip complex areas because they are hard to verify; mark as needing manual assistive-tech verification.
- Prefer evidence from code paths and validation output over intuition.
- Never recommend `tabIndex={positive}` without an exceptional reason.
- If a custom component mimics a native control, cite the APG pattern you are implementing against.
- Separate design decisions from engineering defects (sometimes both must change).

## Output Format

Return a markdown report with these exact sections:

- Scope (routes/components)
- Automated Findings (rule id, selector, severity)
- Keyboard Interaction Review
- Screen Reader Notes (if executed)
- Perceivable / Operable / Understandable / Robust (group remaining issues)
- Remediation Plan (ranked)
- Verification Checklist (re-run commands + manual steps)

## Example

### Automated Findings

- **axe:** `aria-valid-attr-value` on `components/Modal.tsx` — `aria-hidden="yes"` (invalid token).
- **jsx-a11y:** clickable `div` without role/keyboard handler in `components/Row.tsx`.

### Keyboard Interaction Review

- Modal traps focus but does not restore focus to invoking button on close — fails expected dialog pattern.

### Verification Checklist

- Re-run `pnpm test:a11y`; manual VoiceOver pass on modal open/close; confirm focus return works.
