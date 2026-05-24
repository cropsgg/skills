---
name: variant-analysis
description: "Once a bug is found and understood, systematically grep, Semgrep, or CodeQL the entire codebase to find all other occurrences of the same vulnerability class. Find the class, not just the instance."
---

## When To Use

- Immediately after fixing a security bug (SQL injection, XSS, auth bypass, unsafe deserialization) — there are likely more.
- When a code review finds a pattern-level defect (missing timeout, unchecked null, race condition) and you suspect it's copy-pasted.
- After an incident postmortem identifies a bug class that was not previously scanned for.
- When the same bug has been found twice — the third occurrence is almost certainly out there.
- Before closing a security finding as "fixed" — confirm it's the only instance.

Related: `/security-audit` for trust-boundary review of the findings; `/insecure-defaults` for configuration-level variant hunting; `/sharp-edges` for dangerous-API variant hunting; `/static-analysis` to run the tooling that finds variants.

Do not use this skill when the bug is a one-off logic error with no pattern (e.g., a single inverted boolean) — variant analysis requires a pattern to search for. Do not use before the bug is fully understood — you need to know what to search for.

## Core Stance

- A single bug is a pattern — the question is not "did we fix it?" but "where else does this pattern appear?"
- Security bugs in particular are rarely singletons. They propagate through copy-paste, shared patterns, code generation, and team conventions.
- Variant analysis is not grep. Build a precise query — too loose and you drown in false positives; too tight and you miss variants.
- Every hit must be manually verified. Automated pattern matching finds candidates; human (or agent) judgment confirms true positives.
- The deliverable is not a list of hits — it's an assessment of how systemic the bug class is and a prioritized fix plan.

## Research Backing

- **Trail of Bits**, *Variant Analysis Methodology* — systematic approach to finding bug-class instances: define the pattern, build the query, run across codebase, triage hits, assess systemic risk. Core practice in security engineering.
- **Zeller (2009)**, *Why Programs Fail*, Chapter 13 — "Mining the Version Archive": once a bug is understood, search for its siblings by pattern-matching across the codebase and version history.
- **CWE-905: Use of Wrong Operator in String Comparison** — a canonical example of a pattern-detectable vulnerability class where a single `==` vs `===` bug implies many more exist.
- **OWASP Code Review Guide** — variant analysis as a post-fix activity: "after fixing one instance of a vulnerability, search for all other instances of the same class before closing the finding."

## Process

1. **Classify the bug pattern**
   - Describe the pattern in one sentence: "String concatenation used to build SQL queries instead of parameterized queries" or "`fetch()` called without timeout or AbortController."
   - Identify: the dangerous API/function, the missing safeguard, the language-specific signature.
   - Is the pattern language-specific (e.g., Python `eval()`) or language-agnostic (e.g., missing timeout on network call)?

2. **Build the search query**
   - For syntactic patterns: write a Semgrep rule. Template: `pattern: <dangerous-function>(...)` with `pattern-not: <safe variant>`.
   - For simpler patterns: `grep -rn "dangerousFunction(" --include="*.ts" --include="*.tsx" src/`.
   - For deep semantic patterns (data flow, taint): write a CodeQL query if CodeQL is set up. Otherwise, mark the limitation.
   - Review the query: run it on the known bug location to confirm it catches it. Then note the known bug will appear in results — flag it as "already fixed."

3. **Run across the codebase**
   - Semgrep: `semgrep --config <rule-file> --sarif -o /tmp/variant-results.sarif`.
   - grep: `grep -rn "<pattern>" --include="<extensions>" <target-dir>`.
   - CodeQL: `codeql query run <query-file> --database=<db-path> --output=/tmp/variant-results.bqrs`.
   - Record: tool used, query, scope (directories scanned), and hit count.

4. **Verify each hit**
   - For each hit: open the file, read the surrounding context. Is this the same bug class or a false positive?
   - Classification per hit:
     - **True positive:** same bug class, same root cause, needs same fix.
     - **Variant:** same bug class, different manifestation, needs adapted fix.
     - **False positive:** not the same bug class (e.g., safe usage in test file, or the dangerous pattern is inside a comment).
   - Flag any hit in test files specially — test code with the same bug may not be exploitable but signals the pattern is team-wide.

5. **Assess systemic risk**
   - If >5 true positives: the bug class is systemic. Recommend a systemic fix (e.g., linter rule, CI check, shared utility).
   - If 1–4 true positives: fix individually, then add a linter rule to prevent recurrence.
   - If 0 true positives: confirm the query wasn't too narrow. If the query is correct, the bug was isolated.

6. **Report** with hit classification, systemic risk assessment, and prioritized fix plan.

## Operating Rules

- Always verify each hit manually. Do not report grep results as confirmed bugs.
- The query must catch the known bug. If it doesn't, the query is wrong.
- Test files are not exempt from review — a pattern in test code indicates a team-wide habit.
- If CodeQL/Semgrep is unavailable, use grep/ripgrep — but mark the analysis as `[GREP-ONLY — no semantic analysis]`.
- If the variant analysis finds many hits (>20), stop at 20 and report the scope. Don't drown the report — recommend a systemic fix instead.
- Record the query so it can be reused as a CI check after fixes are applied.

## Output Format

Return a markdown report with these exact sections:

- Bug Class (one-sentence description)
- Known Instance (file:line of the already-fixed bug)
- Search Query (tool, query text, scope)
- Hits (total count)
- True Positives (file:line, classification, severity)
- Variants (file:line, how it differs from the known instance)
- False Positives (file:line, why it's not the same class)
- Systemic Risk Assessment (isolated / repeated / systemic)
- Recommended Fix Plan (individual fixes + systemic prevention)
- Query for CI (the search query to add as a pre-commit/CI check)

## Example

### Bug Class

SQL query built via string concatenation instead of parameterized queries. Vulnerable to SQL injection.

### Known Instance

`packages/db/src/queries/users.ts:45` — `db.query("SELECT * FROM users WHERE email = '" + email + "'")` — fixed by converting to `db.query("SELECT * FROM users WHERE email = $1", [email])`.

### Search Query

```bash
grep -rn 'db\.query(' --include="*.ts" src/ | grep -v '\$1'
```

### True Positives

| File:Line | Classification | Severity |
|-----------|---------------|----------|
| `packages/db/src/queries/orders.ts:88` | Identical pattern | High |
| `packages/db/src/queries/products.ts:32` | Identical pattern | High |
| `packages/api/src/admin/reports.ts:67` | Variant — uses template literal | High |
| `packages/db/src/queries/users.ts:45` | Already fixed | — |

### Systemic Risk Assessment

**Systemic** — 3 additional instances found across 2 packages. The pattern was a team convention before parameterized queries were enforced. Recommend: add `eslint-plugin-sql` rule to block string concatenation in `db.query()` calls.

### Recommended Fix Plan

1. Fix `orders.ts:88` and `products.ts:32` (identical fix — 5 minutes)
2. Fix `admin/reports.ts:67` (template literal variant — needs query rewrite)
3. Add `eslint-plugin-sql` to CI with `error` severity
