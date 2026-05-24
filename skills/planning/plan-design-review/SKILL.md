---
name: plan-design-review
description: "Rate each design dimension 0–10 (typography, spacing, color, motion, interaction, accessibility, responsiveness), define what a 10 looks like, then edit the plan before implementation."
---

## When To Use

- After product direction is set and before engineering review locks architecture.
- When a design spec, wireframe, or UI plan exists but hasn't been stress-tested dimensionally.
- Before handing a design plan to `/plan-eng-review` or `/to-issues`.
- When stakeholders ask "how good is this design?" without shared criteria.
- When a design feels off but no one can articulate why specifically.

Related: `/plan-ceo-review` for product scope; `/plan-eng-review` for architecture lock; `/design-review` for auditing shipped UI (not pre-implementation specs); `/accessibility-audit` for WCAG conformance on built UI; `/design-consultation` if no design plan exists yet.

Do not use this skill for live UI audit (use `/design-review`), pure engineering architecture (use `/plan-eng-review`), or when no design plan exists yet (use `/office-hours` or `/design-consultation`).

## Core Stance

- Design quality is multidimensional — "looks good" is not a review.
- Every dimension rated 0–10 with explicit criteria; no dimension below 7 ships without conversation.
- Define what a 10 looks like *for this specific product context*, not an abstract ideal.
- Scores anchor editing: the plan gets revised to close the gap between current and target.
- Trade-offs are explicit — raising one dimension may lower another. Motion richness costs performance; aria compliance may constrain visual design.

## Research Backing

- **Nielsen (1994)**, *Heuristic Evaluation* — systematic expert review methodology: rate against established principles rather than personal preference; 10 usability heuristics as dimensional anchors.
- **Tognazzini (2014)**, *First Principles of Interaction Design* — dimensional evaluation of interaction quality across discoverability, latency reduction, Fitts' Law, and color-blind accessibility.
- **W3C WCAG 2.2 (2023)** — measurable accessibility conformance levels (A/AA/AAA) provide dimensional scoring precedent for design review.
- **Bringhurst (1992)**, *The Elements of Typographic Style* — typography evaluation criteria: measure, hierarchy, contrast, and rhythm as scorable dimensions.
- **Mullet & Sano (1995)**, *Designing Visual Interfaces* — spatial organization and visual hierarchy as scorable design dimensions.

## Process

1. **Establish context**
   - Read the design plan, spec, or wireframe description.
   - Identify: target device(s), user profile, accessibility requirements, brand constraints.
   - Note existing design system if one exists (Tailwind config, `DESIGN.md`, component library).

2. **Score each dimension 0–10**
   - **Typography** — scale clarity, hierarchy depth, legibility per device, line length, font pairing coherence.
   - **Spacing** — rhythm consistency, grid adherence (4px or 8px base), density appropriateness, white space balance.
   - **Color** — palette coherence, contrast ratios (≥4.5:1 body text min), state differentiation (hover/focus/disabled/active), semantic meaning.
   - **Motion** — purposefulness (entrance/attention/feedback/layout-change), duration appropriateness, `prefers-reduced-motion` fallback, easing consistency.
   - **Interaction** — affordance clarity (can I tell it's clickable?), feedback immediacy, discoverability, error prevention.
   - **Accessibility** — keyboard navigation, screen-reader semantics, focus management, target size (≥44×44px), color independence.
   - **Responsiveness** — breakpoint logic, content priority at each width, touch target adaptation, no horizontal scroll on narrow viewports.
   - For each dimension: write the **current score**, then **what a 10 would look like** in this product context.

3. **Visualize the gap**
   - Produce a text radar summary: dimension → current score → target (10) → gap size.
   - Order dimensions by gap size descending.

4. **Prioritize the edit**
   - Blocking: dimensions <7 with high user impact.
   - Polish: dimensions 7–8.
   - Stretch: dimensions 9+ (optional improvements).

5. **Edit the plan**
   - For each prioritized dimension, propose concrete plan amendments.
   - Format: "In [document/section]: [specific change]. Before: [current]. After: [proposed]."
   - Amendments must be concrete enough to hand directly to an engineer.

6. **Re-score after edits**
   - Projected score if all amendments are accepted.
   - Note dimensions where raising one lowers another (trade-offs).

7. **Produce final report** with dimensional scores, amendments, trade-offs, and re-score projection.

## Operating Rules

- Do not audit built UI — this is for plans and specs only. Built UI goes to `/design-review`.
- Do not score below 5 without a specific, fixable reason and a concrete amendment.
- A 10 is contextual — "10 typography for a CLI tool" differs from "10 typography for a marketing site."
- Trade-offs must be surfaced: "Raising motion to 8 may increase bundle by 40KB for animation library."
- If no design plan exists, refuse and recommend `/design-consultation` or `/office-hours`.
- Amendments must be concrete enough that an engineer can implement them without asking "what do you mean?"

## Output Format

Return a markdown report with these exact sections:

- Design Context (device, user, constraints, existing system)
- Dimensional Scorecard (table: dimension, score, what a 10 looks like, gap)
- Radar Summary (text description of shape)
- Blocking Dimensions (<7) — with amendments
- Polish Dimensions (7–8) — with amendments
- Stretch Dimensions (9+) — optional
- Trade-off Notes
- Re-score Projection
- Recommended Next Step

## Example

### Dimensional Scorecard

| Dimension | Score | What a 10 Looks Like | Gap |
|-----------|-------|----------------------|-----|
| Typography | 5 | 3-step scale (14/18/24px), `--lh` tokens per step, measure ≤75ch on desktop, system-ui stack with display face for headings | +5 |
| Spacing | 7 | Consistent 8px grid; section gaps (48px) double component gaps (24px); no magic numbers | +3 |
| Color | 4 | Contrast ≥4.5:1 on all text; hover states differ by ≥30% luminance; semantic red/green/yellow/blue | +6 |
| Motion | 8 | Purposeful (entrance <200ms, attention pulse, layout transition <300ms); `prefers-reduced-motion` respected | +2 |
| Interaction | 6 | All clickable regions ≥44×44px; loading states on every async trigger; focus rings visible on Tab | +4 |
| Accessibility | 3 | Tab order matches visual order; all form inputs labeled; focus rings visible; `aria-*` on custom components | +7 |
| Responsiveness | 7 | Two breakpoints (768/1024); content-first at narrow widths; no horizontal overflow | +3 |

### Blocking Dimensions

**Accessibility (3→7):** Add `--focus-ring` token to Tailwind config with `outline-2 outline-offset-2`. Add `aria-label` to all icon-only buttons in plan spec. Define tab sequence for modal open/close flow in interaction spec.

**Color (4→8):** Replace `#F5F5F5` on `#FAFAFA` button with `#1a1a1a` on `#fafaf9` (contrast 16.5:1). Define hover state as `brightness(0.9)` transform. Add semantic tokens: `--color-success-500`, `--color-error-500`, etc.

### Re-score Projection

After amendments: Typography 8, Color 8, Accessibility 7, Interaction 8. No dimension below 7.

### Recommended Next Step

`/plan-eng-review` with amended plan.
