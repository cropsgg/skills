---
name: pr-review
description: "Pre-merge diff review for production risks: SQL safety, trust boundaries, and side effects."
---

## When To Use

- Before merging any PR that touches auth, payments, migrations, or shared infrastructure.
- When CI is green but the change feels risky (large diff, generated code, subtle control flow).
- On agent-authored PRs where `/self-audit` ran in-session but no human reviewed the diff.
- When reviewing someone else's PR via `gh pr diff` or local branch comparison.

Related: `/self-audit` for the agent's own session diff; `/security-audit` for deep trust-boundary review; `/database-review` for migration-heavy changes.

Do not use this skill for substituting test execution — pair with `/regression-check`.

## Core Stance

- Review the **diff against the base branch**, not intentions in the PR description.
- Assume CI green does not prove correctness — look for untested branches.
- Flag **conditional side effects** (work only runs on certain paths or flags).
- Treat LLM-generated code as untrusted until trust boundaries are verified.
- Prefer blocking issues over nitpicks; separate must-fix from should-fix.

## Research Backing

- **OWASP Code Review Guide** — systematic review categories for injection, auth, and crypto misuse.
- **Google eng practices — Small CLs** — review effectiveness drops with diff size; call out decomposition needs.
- **Beyer et al. (Google, 2016)**, *Site Reliability Engineering* — change management and blast-radius awareness for production changes.

## Process

1. **Establish scope**
   - Base branch and head SHA; `git diff base...HEAD --stat`.
   - Classify: feature, fix, refactor, chore, migration.
2. **Structural pass**
   - New dependencies: license, supply chain, native bindings.
   - Config/secrets: no credentials in diff; env vars documented.
   - Deleted code: orphaned imports, broken routes, stale feature flags.
3. **Trust boundary pass**
   - User input → parsing → storage → output: validate at boundary.
   - AuthZ checks on every mutating path, not only HTTP layer.
   - LLM/tool calls: no unvalidated model output driving SQL, shell, or file writes.
4. **Data and SQL pass**
   - Migrations: reversible or paired with rollback plan; locks and backfill strategy.
   - N+1 queries, missing indexes on new filters, transaction boundaries.
5. **Reliability pass**
   - Retries idempotent? Timeouts set? Partial failure handled?
   - Race conditions: double-submit, concurrent updates, cache invalidation.
6. **Test adequacy**
   - New behavior covered? Snapshots meaningful?
   - List gaps even if CI passes.
7. **Verdict**
   - Approve, request changes, or comment with prioritized findings.

## Operating Rules

- Every blocking finding must cite `file:line` or diff hunk.
- Distinguish **defect** vs **design concern** vs **style**.
- Do not approve migrations without rollback or forward-fix path for high-risk schema changes.
- For agent PRs, verify the PR description matches the diff.
- Use `gh` for GitHub PRs when available.

## Output Format

Return a markdown report with these exact sections:

- PR Scope Summary
- Verdict (Approve / Request Changes / Comment)
- Blocking Findings (severity, location, issue, suggested fix)
- Non-blocking Findings
- Test Coverage Gaps
- Security and Trust Boundary Notes
- Recommended Follow-ups Before Merge

## Example

### Blocking Findings

- **High** — `api/routes/orders.ts:88` — `userId` taken from request body without session check; IDOR allows cross-tenant order access.
  - **Fix:** derive `userId` from authenticated session only.

### Verdict

Request Changes — one blocking auth issue; tests do not cover unauthorized access path.
