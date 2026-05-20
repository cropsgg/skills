---
name: office-hours
description: "Structured ideation with forcing questions before any code is written."
---

## When To Use

- Starting a new product, feature, or major initiative without a design doc.
- When the user has an idea but unclear wedge, user, or success metric.
- Before `/plan-ceo-review` or `/plan-eng-review` on greenfield work.
- Hackathon or side-project exploration (builder mode).

Related: `/requirements-grill` for decision-tree Q&A; `/to-prd` to capture output as a spec issue.

Do not use this skill for incremental bugs, refactors, or tasks with an approved PRD already.

## Core Stance

- Listen to **pain**, not feature requests — reframe when they diverge.
- Six forcing questions must be answered with specifics, not hypotheticals.
- End with a written design doc the user can approve or edit.
- Builder mode is generative; startup mode is interrogative — match user intent.

## Research Backing

- **Ries (2011)**, *The Lean Startup* — problem/solution fit before build.
- **Blank (2013)**, *The Four Steps to the Epiphany* — customer development and hypothesis testing.
- **Norman (2013)**, *The Design of Everyday Things* — goal-directed design.

## Process

1. **Mode select**
   - **Startup:** demand, status quo, desperate specificity, wedge, observation, future-fit
   - **Builder:** coolest version, fastest shareable path, learning goals
2. **Run forcing questions** (one batch at a time)
   - Who specifically needs this? Name a person or role.
   - What do they do today without your product? Cost of status quo?
   - What would make them desperate for a fix this week?
   - Narrowest wedge that still delivers value?
   - What surprised you about the problem space?
   - What must be true in 12 months for this to matter?
3. **Reframe** if feature request ≠ underlying job
4. **Premises** — list falsifiable claims; user validates
5. **Implementation alternatives** — 2–3 approaches with effort and recommendation
6. **Write design doc** to `docs/designs/<slug>.md` or user-specified path:
   - Problem, users, wedge, scope v1, non-goals, open questions

## Operating Rules

- Do not write application code in this skill.
- Push back respectfully when framing is too broad or too narrow.
- Design doc must be approvable in one review pass — scannable headers.
- Save doc path in output for downstream skills.

## Output Format

Return a markdown report with these exact sections:

- Mode (Startup / Builder)
- Reframe (if any)
- Validated Premises
- Alternatives Considered
- Recommended Wedge
- Design Doc Path
- Open Questions
- Suggested Next Skills

## Example

### Recommended Wedge

Daily briefing that aggregates calendar + prep doc links — not full CRM in v1.

### Design Doc Path

`docs/designs/daily-briefing-v1.md`

### Suggested Next Skills

`/plan-eng-review` then `/to-issues`
