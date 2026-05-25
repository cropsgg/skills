---
name: simplify
description: >-
  Code review and cleanup across reuse, quality, and efficiency dimensions.
  Launches three parallel review agents against the current diff, then
  aggregates findings and applies fixes.
---

## When To Use

- After implementing a feature or fix and wanting to clean up before commit.
- When reviewing a PR for reuse opportunities, quality issues, and efficiency problems.
- Before `/self-audit` or `/pr-review` to catch structural issues earlier.
- User says "clean this up", "review my changes", "simplify", or "tighten up."

Related: `/simplifying-code` for decluttering AI-generated code specifically; `/self-audit` for behavior verification; `/pr-review` for pre-merge production risk review.

Do not use this skill for performance profiling (`/performance-optimization`), architectural refactoring (`/architecture-improvement`), or security-specific review (`/security-audit`).

## Core Stance

- Review the diff, not the whole codebase — focus on what changed.
- Run all three review dimensions in parallel for speed.
- Fix issues directly and immediately; skip false positives without argument.
- Every fix should be behavior-preserving unless a behavior change is explicitly requested.

## Process

### Phase 1: Identify Changes

Run `git diff` (or `git diff HEAD` if there are staged changes) to see what changed. If there are no git changes, review the most recently modified files that the user mentioned or that were edited earlier in the conversation.

### Phase 2: Launch Three Review Agents in Parallel

Use the Agent tool to launch all three agents concurrently. Pass each agent the full diff so it has the complete context.

#### Agent 1: Code Reuse Review

For each change:

1. **Search for existing utilities and helpers** that could replace newly written code. Look for similar patterns elsewhere in the codebase — common locations are utility directories, shared modules, and files adjacent to the changed ones.
2. **Flag any new function that duplicates existing functionality.** Suggest the existing function to use instead.
3. **Flag any inline logic that could use an existing utility** — hand-rolled string manipulation, manual path handling, custom environment checks, ad-hoc type guards, and similar patterns are common candidates.

#### Agent 2: Code Quality Review

Review the same changes for hacky patterns:

1. **Redundant state**: state that duplicates existing state, cached values that could be derived, observers/effects that could be direct calls.
2. **Parameter sprawl**: adding new parameters to a function instead of generalizing or restructuring existing ones.
3. **Copy-paste with slight variation**: near-duplicate code blocks that should be unified with a shared abstraction.
4. **Leaky abstractions**: exposing internal details that should be encapsulated, or breaking existing abstraction boundaries.
5. **Stringly-typed code**: using raw strings where constants, enums (string unions), or branded types already exist in the codebase.
6. **Unnecessary JSX nesting**: wrapper Boxes/elements that add no layout value — check if inner component props already provide the needed behavior.
7. **Nested conditionals**: ternary chains, nested if/else, or nested switch 3+ levels deep — flatten with early returns, guard clauses, a lookup table, or an if/else-if cascade.
8. **Unnecessary comments**: comments explaining WHAT the code does (well-named identifiers already do that), narrating the change, or referencing the task/caller — delete; keep only non-obvious WHY (hidden constraints, subtle invariants, workarounds).

#### Agent 3: Efficiency Review

Review the same changes for efficiency:

1. **Unnecessary work**: redundant computations, repeated file reads, duplicate network/API calls, N+1 patterns.
2. **Missed concurrency**: independent operations run sequentially when they could run in parallel.
3. **Hot-path bloat**: new blocking work added to startup or per-request/per-render hot paths.
4. **Recurring no-op updates**: state/store updates inside polling loops, intervals, or event handlers that fire unconditionally — add change-detection guard so downstream consumers aren't notified when nothing changed. Also verify wrapper functions that take updater/reducer callbacks honor same-reference returns, otherwise callers' early-return no-ops are silently defeated.
5. **Unnecessary existence checks**: pre-checking file/resource existence before operating (TOCTOU anti-pattern) — operate directly and handle the error.
6. **Memory**: unbounded data structures, missing cleanup, event listener leaks.
7. **Overly broad operations**: reading entire files when only a portion is needed, loading all items when filtering for one.

### Phase 3: Fix Issues

Wait for all three agents to complete. Aggregate their findings and fix each issue directly. If a finding is a false positive or not worth addressing, note it and move on — do not argue with the finding, just skip it.

When done, briefly summarize what was fixed (or confirm the code was already clean).

## Operating Rules

- All three review agents must run in parallel — never sequential.
- Each agent gets the full diff, not partial context.
- Fix issues directly; do not ask the user for permission on each finding.
- Skip false positives without elaboration; do not debate them.
- After fixing, verify with `npm test` or equivalent if a test suite exists.
- Do not change public APIs or alter behavior unless a finding clearly identifies a bug.

## Output Format

Return a brief summary:

```
## Simplify Results

### Fixed
- [file]: [issue] → [fix]
- ...

### Skipped
- [file]: [issue] — [reason for skipping]

### Clean
No issues found in [areas].
```
