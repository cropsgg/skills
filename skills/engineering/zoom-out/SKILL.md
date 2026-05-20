---
name: zoom-out
description: "Explain unfamiliar code in system context — entry points, dependencies, and data flow."
---

## When To Use

- Onboarding to a new repo or module.
- Before editing code you do not understand.
- When the user asks "how does this work?" or "explain this folder."
- Prior to `/architecture-improvement` or `/plan-eng-review`.

Related: `/domain-context` for terminology; `/investigate` when something is broken.

Do not use this skill for implementing changes — orientation only unless user pivots.

## Core Stance

- Start from **user-visible entry points** (route, CLI, job consumer), not random files.
- Explain at the level of **components and data**, not line-by-line narration.
- Name the 3–5 most important files to read next.
- Call out unknowns explicitly.

## Research Backing

- **Hunt & Thomas (1999)**, *The Pragmatic Programmer* — "Learn to use your tools" and build mental models.
- **Ousterhout (2018)**, *A Philosophy of Software Design* — abstractions and system structure comprehension.
- **IEEE 1016-2009** — software design descriptions for architectural views.

## Process

1. **Identify anchor**
   - User-provided path, symbol, or feature name.
2. **Find entry points**
   - HTTP routes, CLI commands, exports, cron, event subscribers.
3. **Trace one happy path**
   - Input → validation → domain logic → persistence → output.
4. **Map dependencies**
   - Internal modules, external services, env vars.
5. **Summarize**
   - Purpose in one paragraph
   - Mermaid or bullet diagram if helpful
   - "Read next" file list
6. **List unknowns** — areas not verified in this pass.

## Operating Rules

- Prefer reading code over guessing.
- Do not dump entire files — synthesize.
- Match depth to user question (folder vs single function).
- Use `CONTEXT.md` terms when available.

## Output Format

Return a markdown report with these exact sections:

- Purpose (one paragraph)
- Entry Points
- Happy Path Walkthrough
- Key Dependencies
- Diagram (optional mermaid)
- Files to Read Next
- Unknowns / Follow-up Questions

## Example

### Purpose

Checkout orchestrates cart validation, tax lookup, payment intent creation, and order persistence.

### Entry Points

- `POST /api/checkout` → `apps/web/app/api/checkout/route.ts`

### Files to Read Next

1. `packages/cart/src/checkout.ts`
2. `packages/payments/src/stripe.ts`
