---
name: design-consultation
description: "Build a complete design system from scratch: 11-step color palettes (OKLCH-optimized), typography scale with ratio, spacing system, component tokens, and dark mode strategy. Outputs DESIGN.md and token files."
---

## When To Use

- Greenfield project with no design system — no Tailwind config, no `DESIGN.md`, no component tokens.
- When the user asks to "set up a design system," "create design tokens," or "define the visual foundation."
- Before building UI components at scale — prevents one-off color values and spacing drift.
- When adding dark mode to an existing codebase that lacks token architecture.
- After a design shotgun identified a visual direction but no tokens exist yet.
- When the existing design system has no token file — only hardcoded values scattered across components.

Related: `/plan-design-review` to score the generated system against dimensional criteria; `/domain-context` to align naming conventions with the project glossary; `/office-hours` if the product identity isn't yet defined.

Do not use this skill for designing individual UI components (use `/tdd` or implementation), for auditing shipped UI (use `/design-review`), or when a complete design system already exists and only needs tweaks.

## Core Stance

- A design system is infrastructure, not decoration — it prevents drift, reduces decisions-per-component from ~10 to ~2, and makes dark mode a token swap rather than a rewrite.
- Generate the system as code (CSS custom properties, Tailwind config, or platform-native tokens), not a Figma-export artifact that must be manually translated.
- Every token must answer two questions: "Where is this used?" and "Why this value?" No arbitrary numbers.
- Dark mode is not a separate system — it is the same token architecture with alternate values. Design for it from the start.
- Ship with a `DESIGN.md` reference that serves as the single source of truth for agents and humans reading the tokens.

## Research Backing

- **Frost (2016)**, *Atomic Design* — methodology for building hierarchical design systems: atoms (tokens) → molecules → organisms → templates → pages; tokens as the atomic layer.
- **W3C Design Tokens Community Group (2024)**, *Design Tokens Format* — specification for platform-agnostic design token representation; tooling interoperability across Figma, Style Dictionary, and code generators.
- **Kholmatova (2017)**, *Design Systems* — practical framework for defining functional and perceptual patterns; shared language between design and engineering teams reduces implementation errors.
- **Mullet & Sano (1995)**, *Designing Visual Interfaces* — perceptual principles (contrast, alignment, proximity, hierarchy) that tokens must encode to produce coherent interfaces.

## Process

1. **Audit the blank canvas**
   - Confirm: no existing `tailwind.config.*`, `DESIGN.md`, `tokens/`, or `styles/variables.css` with semantic tokens.
   - If partial system exists: list what to extend vs what to replace. Do not overwrite without user confirmation.
   - If a complete system exists: stop and recommend `/plan-design-review` instead.

2. **Define the product identity** (ask 5 questions)
   - Brand personality adjective (clinical / warm / bold / minimal / playful / editorial)
   - Density preference (data-dense / balanced / airy)
   - Motion appetite (minimal / purposeful / playful)
   - Accessibility floor (AA / AAA)
   - Platform(s) (web-only / web+mobile / cross-platform)

3. **Generate color system**
   - Primary palette: 11-step scale (50/100/200/300/400/500/600/700/800/900/950). Prefer OKLCH-based generation for perceptual uniformity.
   - Secondary and accent palettes: same 11-step scale.
   - Neutral gray scale: warm or cool gray, 11 steps.
   - Semantic colors: success (green), warning (amber), error (red), info (blue). 5-step scales (100/300/500/700/900).
   - Verify contrast: body text on surface ≥4.5:1 for AA, ≥7:1 for AAA. Flag any failing pairs.
   - Output as CSS custom properties: `--color-primary-500: oklch(...)`, etc.

4. **Generate typography scale**
   - 3–5 steps with ratio: 1.25 (minor third) for editorial, 1.333 (perfect fourth) for general, 1.5 for data-dense.
   - Font stack: `system-ui, -apple-system, sans-serif` as base; branded display font optional for headings.
   - Line heights per step: `--leading-tight` (1.2 for headings), `--leading-normal` (1.5 for body), `--leading-relaxed` (1.75 for long-form).
   - Max-width reading measure: `--measure: 65ch` (optimal readability range).
   - Output as: `--text-xs` through `--text-4xl` with paired `--leading-*` and `--tracking-*` tokens.

5. **Generate spacing system**
   - Base unit: 4px (finer control) or 8px (simpler). Ask user or default to 4px for web, 8px for mobile-first.
   - Scale: 0, 0.5 (2px if base 4), 1 (base), 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.
   - Named tokens: `--space-3xs` (0.5×) through `--space-3xl` (24×).
   - Gap tokens: component-internal gaps use smaller steps; section gaps use larger steps.

6. **Generate component tokens**
   - Radius: `--radius-sm` (2px), `--radius-md` (4px), `--radius-lg` (8px), `--radius-xl` (12px), `--radius-full` (9999px).
   - Shadow: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-2xl` with elevation key.
   - Border: `--border-default` (1px), `--border-focus` (2px), `--border-error` (2px).
   - Z-index: `--z-dropdown` (100), `--z-sticky` (200), `--z-overlay` (300), `--z-modal` (400), `--z-toast` (500).

7. **Generate dark mode**
   - Strategy: `prefers-color-scheme` media query OR `[data-theme="dark"]` class toggle. Ask user preference.
   - For every color token, define light and dark values. Surface elevation: lighter surfaces on higher layers in light mode → reversed in dark mode (higher = lighter to create depth illusion).
   - Verify dark mode contrast parity with light mode.

8. **Write output artifacts**
   - `DESIGN.md` — token reference with rationale, usage examples, anti-patterns, and upgrade guide.
   - Token file: `styles/tokens.css` (CSS custom properties), `tailwind.config.*` extension (`theme.extend`), or platform-specific format.
   - Component token map: table mapping component primitives (button, input, card, dialog, table) to the tokens they consume.

## Operating Rules

- Do not invent brand personality — ask the identity questions before generating.
- Color scales must be perceptually uniform. Use OKLCH or LCH for generation; HSL is not perceptually uniform.
- Every token must appear in at least one usage example in `DESIGN.md`.
- Dark mode values must be manually verified for contrast parity — do not assume inversion works.
- If user refuses the identity questions, default to: neutral/minimal, balanced density, purposeful motion, AA, web-only — and note that defaults were used.
- Never generate design tokens without a `DESIGN.md` reference document.

## Output Format

Return a markdown report with these exact sections:

- Product Identity (5 answers or defaults used)
- Color System (palettes, semantic colors, contrast verification)
- Typography Scale (steps, ratio, font stack, leading tokens)
- Spacing System (base unit, scale table, most-used values)
- Component Tokens (radius, shadow, border, z-index with usage)
- Dark Mode Strategy (method, elevation inversion rules, contrast parity)
- Artifacts Created (file paths + line counts)
- Component Token Map
- Known Gaps (e.g., "motion tokens not yet generated — deferred")
- Recommended Next Step

## Example

### Product Identity

- Personality: warm, accessible, editorial
- Density: balanced
- Motion: purposeful
- Accessibility: AA for UI chrome, AAA for body text
- Platform: web (Next.js + Tailwind CSS)

### Color System

- Primary: warm amber — `--color-primary-500: oklch(0.79 0.17 85)`
- Neutral: warm gray — `--color-neutral-500: oklch(0.55 0.02 85)`
- Semantic: success `oklch(0.62 0.19 145)`, error `oklch(0.55 0.22 25)`
- Body text on surface: contrast 7.2:1 (passes AAA)

### Artifacts Created

- `DESIGN.md` — 180 lines, complete token reference
- `tailwind.config.ts` — `theme.extend` with colors, spacing, fontSize, borderRadius, boxShadow, zIndex
- `styles/tokens.css` — 85 CSS custom properties, light + dark variants

### Component Token Map

| Component | Colors | Spacing | Radius | Shadow |
|-----------|--------|---------|--------|--------|
| Button | primary-500, neutral-50 (text) | px-4 py-2 | radius-md | shadow-sm |
| Card | surface, neutral-200 (border) | p-6 | radius-lg | shadow-md |
| Input | surface, neutral-300 (border), primary-500 (focus) | px-3 py-2 | radius-md | none |

### Recommended Next Step

`/plan-design-review` to score the system before component implementation.
