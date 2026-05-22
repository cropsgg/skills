---
name: simplifying-code
description: >-
  Declutter code without changing behavior. Targets AI-generated slop:
  redundant comments, unnecessary defensive checks, over-abstraction, verbose
  stdlib reimplementations, and speculative generality. Applies changes in
  priority order and stops before touching public APIs or behavior.
---

## When To Use

- File has >30% comments that restate the code.
- Function has >3 levels of nested abstraction (helper calling helper calling helper).
- Module exports >10 public functions, 5 of which are only used once.
- TypeScript types have `| null | undefined` on variables initialized immediately.
- User says "clean this up", "this is too complex", "simplify", or "remove the noise."
- After any major AI-generated feature is merged.

Related: `/self-audit` for behavior verification post-simplification; `/pr-review` for pre-merge quality check.

Do not use this skill for performance optimization (`/performance-optimization`), architectural refactoring (`/architecture-improvement`), or when behavior changes are intentional.

## Core Stance

- AI-generated code tends toward defensive verbosity: comments for every line, simple operations wrapped in utilities "just in case," null checks on guaranteed non-null variables, generic solutions for specific problems.
- This "AI slop" accumulates into code that is hard to read, slow to change, and intimidating to new developers.
- Goal is cognitive load reduction — a human reader should understand intent in <10 seconds per function.
- Simplification is behavior-preserving. It does not optimize for performance. It optimizes for human comprehension.

## Research Backing

- **Beck (1999)**, *Extreme Programming Explained* — "Do the simplest thing that could possibly work." Simplicity is a core XP value; unnecessary complexity is the primary source of technical debt.
- **Martin (2008)**, *Clean Code* — Comments should explain "why", not "what." Redundant comments are noise that must be maintained alongside code.
- **Fowler (2018)**, *Refactoring*, 2nd ed. — Inline Function, Remove Dead Code, and Replace Custom with Standard are cataloged refactorings; each step behavior-preserving and verifiable.

## Process

Apply simplifications in priority order. Stop if a change would alter behavior:

1. **Delete redundant comments** — Remove comments that restate code, are outdated, are authorship signatures, explain obvious types. Keep comments that explain "why" (not "what"), document non-obvious business rules, or mark known technical debt.
2. **Inline single-use helpers** — If a helper is called exactly once and <5 lines, inline at call site. Exception: keep if name carries semantic weight (`calculateTax` over raw formula).
3. **Remove unnecessary defensive checks** — Remove checks impossible given type system or prior assignment. `if (user)` when typed `User` (not `User | null`). `if (array.length > 0)` before `.map()`. Keep checks at system boundaries (API inputs, file reads, user input).
4. **Collapse verbose stdlib reimplementations** — Hand-rolled dedup → `[...new Set(arr)]`. Manual deep clone → `structuredClone(obj)`. Custom debounce → `lodash.debounce`. Hand-rolled slugify → `encodeURIComponent`.
5. **Remove speculative generality** — `DatabaseAdapter` with one implementation. Config with 12 properties, 3 used. Utils folder with 20 files, 15 under 10 lines. Generic type parameters always instantiated with same type.
6. **Consolidate duplicate logic** — Identical code blocks across files → shared utility. Similar-but-not-identical → leave unless trivial to parameterize.

## Operating Rules

- Do not touch public APIs — don't rename exported functions, change signatures, or remove exported symbols.
- If a public API is genuinely bad, document it and flag for breaking-change refactor, but don't change under this skill.
- After each simplification pass, run full test suite. If tests fail: revert batch, identify breaking change, fix or skip file. Do not fix tests to match simplified code unless tests test implementation details, not behavior.

## Output Format

Produce `SIMPLIFICATION_REPORT.md`:
```markdown
# Simplification Report: [File/Module]
## Metrics
- Lines before: N
- Lines after: N
- Comments removed: N
- Functions inlined: N
- Defensive checks removed: N
## Changes
1. `src/auth.ts`: Removed 4 redundant comments. Inlined `hashPassword` helper.
2. `src/utils.ts`: Replaced custom `debounce` with `lodash.debounce`.
## Risks
- [Any behavior-adjacent changes and why they are safe]
## Verification
- `npm test` passed: [timestamp]
```

## Example

**Before (42 lines):**
```typescript
// This function processes the user list
function processUsers(users: Array<User>): Array<User> {
  // Check if users array is empty
  if (users.length === 0) {
    return []; // Return an empty array if no users
  }
  
  // Create a new array to store processed users
  const processedUsers: User[] = [];
  
  // Loop through each user
  for (let i = 0; i < users.length; i++) {
    // Get the current user
    const user = users[i];
    // Add the user to processed array
    processedUsers.push(user);
  }
  
  // Return the processed users
  return processedUsers;
}
```

**After (4 lines):**
```typescript
function processUsers(users: User[]): User[] {
  return [...users];
}
```
