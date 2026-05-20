---
name: tdd
description: "Test-driven development with red-green-refactor loops on vertical slices."
---

## When To Use

- When implementing a new feature with clear acceptance criteria and test infrastructure exists.
- When fixing a bug — write a failing test that reproduces it first.
- When refactoring — lock behavior with tests before changing structure.
- When agent-generated code lacks coverage for new branches.

Related: `/regression-check` to run the full suite after TDD slices; `/self-audit` after completing a slice.

Do not use this skill for exploratory spikes with no test framework, one-off scripts, or pure documentation changes.

## Core Stance

- **Red → Green → Refactor:** failing test first, minimal pass, then clean up.
- One vertical slice at a time — not an entire epic in one test file.
- Tests document behavior; avoid testing implementation details.
- Prefer real boundaries (HTTP handler, public API) over private method tests when practical.
- Never leave skipped tests without a tracked reason.

## Research Backing

- **Beck (2000)**, *Extreme Programming Explained* — TDD as design feedback; small steps reduce defect rate.
- **Hunt & Thomas (1999)**, *The Pragmatic Programmer* — “always take small deliberate steps”; feedback rate is the speed limit.
- **Meszaros (2007)**, *xUnit Test Patterns* — test doubles, fixtures, and maintainable test design.

## Process

1. **Define the slice**
   - One user-visible behavior or one bug repro in a single sentence.
   - Identify the test layer: unit, integration, or e2e (smallest that proves the behavior).
2. **Red — write failing test**
   - Name test after behavior: `applies discount when code is valid`.
   - Assert on outcomes, not internals.
   - Run test; confirm it fails for the right reason.
3. **Green — minimal implementation**
   - Write the smallest code to pass; resist extra features.
   - Run test; confirm pass.
4. **Refactor**
   - Remove duplication; improve names; extract only when duplication appears twice.
   - Re-run test after each refactor step.
5. **Repeat**
   - Next slice until acceptance criteria met.
6. **Integrate**
   - Run broader suite (`/regression-check` scope).

## Operating Rules

- Do not write production code before a failing test for new behavior (bug fixes may start from repro test).
- Do not mock what you do not own unless isolation requires it.
- Avoid snapshot tests for logic — use explicit assertions.
- Match project test runner conventions (`bun test`, `pytest`, `go test`, etc.).
- Keep tests fast; mark slow integration tests explicitly.

## Output Format

Return a markdown report with these exact sections:

- Slice Definition
- Red (test written + failure output)
- Green (implementation summary)
- Refactor Notes
- Tests Added (file paths)
- Remaining Slices (if any)
- Suite Status

## Example

### Slice Definition

Applying a valid discount code reduces order total by the configured percentage.

### Red

- Added `packages/pricing/src/discounts.test.ts` — fails: `applyDiscount` returns original total.

### Green

- Implemented percentage lookup in `discounts.ts` — test passes.

### Tests Added

- `packages/pricing/src/discounts.test.ts`
