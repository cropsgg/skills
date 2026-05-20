---
name: design-review
description: "Live visual and UX audit of web UI with evidence-backed findings."
---

## When To Use

- Before shipping UI changes to production or major marketing pages.
- When the user reports "it looks off", spacing issues, or inconsistent components.
- After `/qa-report` when visual polish is the remaining gap.
- Periodic design health pass on key flows (login, dashboard, checkout).

Related: `/accessibility-audit` for WCAG; `/qa-report` for functional bugs; `/performance-optimization` for render cost.

Do not use this skill for backend-only changes or when no UI is renderable.

## Core Stance

- Judge against **consistency**, hierarchy, spacing, and affordance — not personal taste alone.
- Compare to existing design system or dominant patterns in the repo.
- Every finding: location, issue, suggested fix, severity.
- Prefer browser evidence (snapshot/screenshot) over guessing from source alone.
- If IDE browser MCP is unavailable, audit from source plus user-supplied screenshots; mark visual claims as **unverified**.

## Research Backing

- **Nielsen (1994)**, heuristic evaluation — visibility, consistency, error prevention.
- **W3C WAI-ARIA Authoring Practices** — component patterns for accessible, predictable UI.
- **Mullet & Sano (1995)**, *Designing Visual Interfaces* — visual hierarchy and alignment.

## Process

1. **Establish baseline**
   - Read `DESIGN.md`, Tailwind config, or reference components if present.
   - List 5–10 in-repo patterns to match (buttons, forms, typography).
2. **Capture current state**
   - Browser MCP: key pages at desktop + mobile widths; screenshots.
3. **Audit checklist**
   - Typography scale and line length
   - Spacing rhythm (8px grid or project equivalent)
   - Color contrast and state styles (hover, focus, disabled)
   - Component reuse vs one-off styles
   - Loading, empty, and error states
   - Motion: purposeful vs distracting
4. **Prioritize fixes**
   - Critical: broken layout, unreadable text, misleading affordances
   - Medium: inconsistency, cramped spacing
   - Low: polish, micro-alignment
5. **Output report** — fix loop only if user explicitly requests implementation after review.

## Operating Rules

- Cite selectors or routes for each finding.
- Do not flag "AI slop" generically — be specific (e.g. "hero uses 4 font sizes").
- Match project conventions; do not impose unrelated design trends.
- If fixing: one issue per commit when user requests fixes.

## Output Format

Return a markdown report with these exact sections:

- Pages Reviewed
- Design Baseline Used
- Critical Issues
- Medium Issues
- Low / Polish Issues
- Before/After Evidence (paths or descriptions)
- Recommended Fix Order

## Example

### Critical Issues

- `/pricing` — CTA button same color as background (`#F5F5F5` on `#FAFAFA`); fails visibility heuristic.

### Recommended Fix Order

1. Pricing CTA contrast
2. Unify form field heights across checkout and settings
