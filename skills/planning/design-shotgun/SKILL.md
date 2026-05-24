---
name: design-shotgun
description: "Generate 3–5 radically different UI variations for the same feature to force divergence before convergence. Each variation has a memorable name, declared trade-offs, and a failure mode."
---

## When To Use

- Before committing to a UI layout when multiple valid approaches exist.
- When stakeholders are stuck debating one idea without alternatives.
- When the first design idea "feels fine" but hasn't been stress-tested against alternatives.
- During greenfield feature design after requirements are clear but layout is not.
- When a feature has high interaction complexity (dashboards, data displays, multi-step workflows).

Related: `/brainstorming` for named architectural approaches; `/plan-design-review` to score the chosen variation; `/office-hours` if the feature identity isn't defined yet; `/plan-ceo-review` to align on scope before shotgunning.

Do not use this skill for trivial UI (single button, copy change), for backend-only changes, when a PRD-approved design spec already exists and is locked, or when only one viable layout exists (then note the constraint and proceed).

## Core Stance

- The first design idea is rarely the best — it's just the most available to the mind that generated it.
- Divergence must happen before convergence: generate extremes to find the center, not variations on the first idea.
- Each variation must be named, distinct in layout metaphor, and defensible — not three shades of the same layout.
- Variations expose hidden assumptions: "I didn't realize this could be a timeline view."
- The user picks one variation as the direction. The others are discarded — this is not a committee blend of all five.

## Research Backing

- **Osborn (1953)**, *Applied Imagination* — structured brainstorming principle: defer judgment, generate quantity before quality, then converge. Shotgun applies this to UI layout generation.
- **Nielsen (1993)**, *Usability Engineering* — parallel design methodology: generating 3–4 alternatives independently produces measurably better final designs than iterating on a single version.
- **Dow et al. (2010)**, *Parallel Prototyping Leads to Better Design Results* — empirical study: designers who created multiple prototypes in parallel produced better final solutions (higher expert ratings, more diverse ideas) than those who iterated serially on one design.
- **Tassoul & Buijs (2007)**, *Creative Problem Solving: Clustering and Ideation* — forced divergence through constraints and extreme positions before clustering into a chosen direction.

## Process

1. **Define the feature slice**
   - One sentence: what job does the user need to accomplish?
   - Constraints: data shape, interaction requirements, known technical limits.
   - Anti-goals: what this feature explicitly is NOT.

2. **Identify axes of variation**
   - Information density: dense (spreadsheet) ↔ sparse (one-thing-per-screen).
   - Navigation model: modal ↔ inline ↔ progressive disclosure ↔ search-forward.
   - Layout metaphor: table ↔ cards ↔ timeline ↔ canvas ↔ list-detail.
   - Interaction primacy: click-driven ↔ type-ahead ↔ gesture-driven.
   - Pick 3–4 axes that matter most for this feature.

3. **Generate 3–5 named variations**
   - Each with a memorable, descriptive name — not "Option A" but "Dense Command Table," "Kanban Explorer," "Timeline Narrative."
   - Description: layout sketch (ASCII or text), key interaction beats, what it optimizes for, what it sacrifices.
   - Visual character: information density, color use, motion profile.
   - State coverage: loading state, empty state, error state, edge case for each variation.

4. **Declare trade-offs per variation**
   - Table: Variation | Optimizes for | Sacrifices | Best when | Worst when | Failure mode
   - Failure mode: the condition under which this variation breaks down (e.g., "fails when data exceeds 500 rows," "fails on mobile <375px").

5. **User selects direction**
   - Present all variations with their trade-off table.
   - User picks one variation as the direction.
   - If none fits, user specifies which aspects to remix — then generate a sixth variation that combines the specified aspects. Still pick one.

6. **Document the shotgun**
   - Save all variations to `docs/designs/SHOTGUN_YYYYMMDD_[feature-slug].md`.
   - Discarded variations are institutional memory — they explain why certain directions were rejected.
   - The selected variation becomes the input to `/plan-design-review`.

## Operating Rules

- Generate at least 3 variations, at most 5. Two is not divergence — it's a binary choice, not exploration.
- Variations must differ in their layout metaphor, not just their color or spacing. Same-list-with-different-colors is one variation.
- Do not design-implement any variation — this is divergence only. Implementation starts after `/plan-design-review` on the chosen direction.
- Do not mix-and-match into a franken-design unless the user explicitly requests a remix as a sixth variation.
- Each variation must declare its failure mode. If you can't think of one, the variation isn't specific enough.
- If only one variation seems possible, push harder: "What if we removed the sidebar entirely? What if this was a command palette instead of a page?"

## Output Format

Return a markdown report with these exact sections:

- Feature Slice (one sentence + constraints + anti-goals)
- Axes of Variation (3–4 axes with extremes)
- Variation A: [Name] — description, strengths, sacrifices, failure mode
- Variation B: [Name] — description, strengths, sacrifices, failure mode
- Variation C: [Name] — description, strengths, sacrifices, failure mode
- (Variation D/E if applicable)
- Trade-off Matrix (table)
- Selected Direction (with rationale)
- Shotgun Document Path
- Recommended Next Step

## Example

### Feature Slice

Product catalog browsing for a B2B wholesale platform. 5,000+ SKUs with complex filtering (category, price range, minimum order quantity, lead time). User needs to compare 2–4 products side by side and request quotes.

### Axes of Variation

- Density: dense rows ↔ visual cards ↔ spatial scatter
- Navigation: faceted sidebar ↔ inline filters ↔ search-forward
- Comparison: side-by-side fixed panel ↔ hover flyout ↔ dedicated compare page

### Variation A: Dense Command Table

Spreadsheet-like rows, faceted sidebar, inline checkboxes → compare drawer.
**Optimizes for:** power users scanning 50+ rows, batch operations.
**Sacrifices:** visual appeal, mobile experience, first-time learnability.
**Failure mode:** fewer than 20 products — feels empty and overwhelming.

### Variation B: Visual Card Grid

3-column card grid, image-first, hover quick-compare, search bar with autocomplete.
**Optimizes for:** visual browsing, first-time discovery, product imagery.
**Sacrifices:** scan speed at high row count, batch operations.
**Failure mode:** products lack images — cards become empty shells.

### Variation C: Spatial Scatter Canvas

2D scatter plot (price × lead time), dot size = MOQ, select dots → compare panel.
**Optimizes for:** trade-off pattern recognition, outlier discovery.
**Sacrifices:** learnability, accessibility, text-based search.
**Failure mode:** all products cluster in one region — no visual separation.

### Trade-off Matrix

| Variation | Optimizes for | Worst when | Failure mode |
|-----------|---------------|------------|--------------|
| Dense Command Table | Scan speed, batch ops | <20 products, mobile | Feels empty |
| Visual Card Grid | Discovery, imagery | No images, >200 products | Empty shells |
| Spatial Canvas | Pattern recognition | Clustered data, accessibility | No separation |

### Selected Direction

Variation A (Dense Command Table) — user prioritizes scan speed for repeat buyers.

### Shotgun Document Path

`docs/designs/SHOTGUN_20260524_product-catalog.md`

### Recommended Next Step

Save shotgun doc, then `/plan-design-review` on the Dense Command Table variation.
