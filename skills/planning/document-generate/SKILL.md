---
name: document-generate
description: "Audit existing docs against the four Diataxis quadrants, identify empty quadrants, and generate missing documentation from scratch. Each generated doc serves its quadrant's specific user need."
---

## When To Use

- When `/document-release` reveals entire Diataxis quadrants that are empty for key subsystems.
- When a new subsystem has shipped with zero documentation in any quadrant.
- When the user says "write the docs for X" or "we need documentation for this."
- When a subsystem is being handed off and docs are needed for the receiving team.
- When CI enforces a documentation coverage gating rule that the repo currently fails.

Related: `/document-release` for release-triggered doc updates and Diataxis coverage mapping; `/docs-sync` for continuous alignment of existing docs; `/domain-context` for shared glossary that docs should reference.

Do not use this skill when docs exist and just need updates (use `/docs-sync` or `/document-release`), for non-technical prose (marketing, blog posts, brand narrative), or when the audience and use case for the doc are not yet defined.

## Core Stance

- Every Diataxis quadrant serves a different user need. A codebase with only reference docs has no onboarding path. A codebase with only tutorials has no depth.
- Generate for the quadrant, not generically. A tutorial is step-by-step and assumes nothing. A reference is comprehensive and assumes competence. A how-to is task-oriented. An explanation provides context.
- Docs are written for the next engineer at 3am. Explicit commands, expected outputs, failure signatures, and troubleshooting steps.
- Every generated doc must include: audience statement (who is this for?), prerequisite list (what must they already know?), and usage context (when to read this vs another doc).

## Research Backing

- **Procida (2017)**, *Diátaxis: A Systematic Framework for Technical Documentation* — four-mode taxonomy with distinct conventions per quadrant: tutorials are learning-oriented and sequential; how-tos are task-oriented and can be read out of order; reference is descriptive and neutral; explanation is discursive and provides context.
- **Google Technical Writing Courses** — audience-first documentation methodology: define the reader persona before writing; write for the reader who doesn't have the context the writer has.
- **Aghajani et al. (2019, IEEE/ACM MSR)**, *Software Documentation Issues Unveiled* — incomplete documentation (missing quadrants) is as harmful as incorrect documentation for onboarding and maintenance tasks.

## Process

1. **Audit existing docs against the four quadrants**
   - Inventory all existing docs for the target subsystem.
   - For each doc: classify which Diataxis quadrant(s) it serves.
   - Quadrants:
     - **Tutorials** — learning-oriented, step-by-step, takes reader from zero to basic competence. Sequential, must be read in order.
     - **How-to guides** — task-oriented, solves a specific problem. Assumes basic competence. Can be read out of order.
     - **Reference** — information-oriented, describes the machinery. Accurate, complete, neutral. Designed for consultation, not reading.
     - **Explanation** — understanding-oriented, explains why and how. Provides background, context, design rationale.
   - The same doc can serve multiple quadrants — note partial coverage.

2. **Identify empty quadrants**
   - For each empty quadrant: define the audience and use case.
   - Tutorial audience: "An engineer new to this subsystem who needs to complete their first task."
   - How-to audience: "An engineer who knows the subsystem basics and needs to solve a specific problem."
   - Reference audience: "An engineer who needs to look up a specific API, config option, or behavior."
   - Explanation audience: "An engineer who needs to understand why the subsystem works the way it does."

3. **Prioritize which empty quadrants to generate**
   - Priority 1: Tutorials (no onboarding path for any subsystem is a blocker).
   - Priority 2: Reference (no lookup path means engineers reverse-engineer from source).
   - Priority 3: How-to guides (common task patterns that generate repeated questions).
   - Priority 4: Explanation (ADRs and design docs may already cover this partially).

4. **Generate tutorial drafts**
   - Structure: "Goal: by the end, you'll have [specific outcome]." Steps numbered. Every step includes the exact command and expected output. Troubleshooting at each step. Prerequisites listed first.
   - Length: complete a tutorial in ≤30 minutes. If longer, split into multiple tutorials.

5. **Generate reference drafts**
   - Structure: exhaustive listings. API reference: endpoint, method, params, response, errors, example. Config reference: key, type, default, description, example. CLI reference: command, flags, exit codes, examples.
   - Format: designed for `Ctrl+F` lookup. Dense, scannable, no narrative.

6. **Generate how-to drafts**
   - Structure: "Problem: [specific task]." Prerequisites. Steps. Expected result. Troubleshooting. Alternative approaches.
   - Each how-to is self-contained — no "see tutorial step 3 first."

7. **Generate explanation drafts**
   - Structure: context, design rationale, trade-offs, alternatives considered, historical decisions. Links to ADRs and relevant PRs.
   - Narrative, not bullet-list. Explains why, not just what.

8. **User review and finalize**
   - Present drafts for user review. Flag any sections that need owner confirmation (`[NEEDS OWNER CONFIRMATION]`).
   - After approval: finalize, save to `docs/`, update the Diataxis coverage map.

9. **Report** with generated docs, quadrant coverage before/after, and any remaining gaps.

## Operating Rules

- Never generate docs without first auditing existing coverage. The audit is mandatory.
- Tutorials must be end-to-end verifiable — the writer should be able to follow the steps and get the described outcome.
- Reference docs must be comprehensive for the subsystem scope. "Common endpoints only" is not a reference.
- If the subsystem behavior is not yet stable, flag the doc as `[BETA — subject to change]` and link to the tracking issue.
- Generated docs must include: audience statement, prerequisite list, and usage context (when to read this doc vs another).
- Never fabricate behavior — if unsure how something works, flag it `[NEEDS OWNER CONFIRMATION]` rather than guessing.
- Use the project's existing doc conventions (Markdown flavor, heading style, code block language tags).

## Output Format

Return a markdown report with these exact sections:

- Subsystem Scope
- Existing Coverage (before audit — quadrant × doc matrix)
- Empty Quadrants (audience + use case per quadrant)
- Generated Docs (file paths, quadrant, summary, line count)
- Unconfirmed Sections (items marked `[NEEDS OWNER CONFIRMATION]`)
- Coverage After Generation (updated quadrant × doc matrix)
- Remaining Gaps
- Recommended Next Step

## Example

### Existing Coverage — Checkout Subsystem

| Doc | Tutorial | How-to | Reference | Explanation |
|-----|----------|--------|-----------|-------------|
| `docs/api/checkout-openapi.yaml` | ✗ | ✗ | ✓ | ✗ |
| `docs/adr/003-checkout-idempotency.md` | ✗ | ✗ | ✗ | ✓ |

Coverage: 2/4 quadrants partially (reference thin — OpenAPI only, no config ref).

### Empty Quadrants

- **Tutorial:** "First checkout integration" — audience: new payment engineer. Use case: get a checkout endpoint working in dev.
- **How-to:** "Apply a coupon to a checkout" — audience: checkout engineer. Use case: the most common task pattern.

### Generated Docs

- `docs/tutorials/first-checkout-integration.md` — Tutorial, 120 lines. Step-by-step: set up dev env → create test cart → call checkout endpoint → verify response.
- `docs/how-to/apply-checkout-coupon.md` — How-to, 80 lines. Prerequisites → validate coupon → apply to cart → verify discount in response.
- `docs/reference/checkout-config.md` — Reference, 150 lines. Exhaustive config keys, env vars, feature flags, rate limits, error codes.

### Coverage After Generation

Coverage: 4/4 quadrants. Tutorial ✓, How-to ✓, Reference ✓, Explanation ✓.

### Recommended Next Step

Run `/document-release` to build the full Diataxis coverage map including the new docs.
