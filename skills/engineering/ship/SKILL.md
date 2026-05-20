---
name: ship
description: "Portable ship loop: sync base, test, review diff, commit, push, and open a PR."
---

## When To Use

- When feature work is complete and ready for review on a remote branch.
- Before asking a human to review — ensure tests run and diff is scoped.
- After `/self-audit` and `/regression-check` on agent-authored changes.
- When the user says "ship it", "open a PR", or "push for review."

Related: `/pr-review` on the diff before merge; `/regression-check` for test execution; user git safety rules for commits.

Do not use this skill for merging to main, force-push, or production deploy without explicit user request.

## Core Stance

- Ship means **reviewable PR**, not production deploy.
- Never force-push to `main`/`master`; warn if requested.
- Never skip hooks (`--no-verify`) unless the user explicitly requests it.
- Only commit when changes exist; never empty commits.
- Follow repository commit message style from `git log`.

## Research Backing

- **Google eng practices — Code Review** — small, reviewable changes with tests improve quality and velocity.
- **DORA metrics research (Forsgren et al.)** — trunk-based flow with automated checks correlates with delivery performance.
- **Beyer et al. (Google, 2016)**, *Site Reliability Engineering* — change management discipline before production exposure.

## Process

1. **Pre-flight**
   - `git status` — understand staged, unstaged, untracked files.
   - Confirm current branch; create feature branch if on `main`.
2. **Sync base**
   - Fetch and merge/rebase base branch (`main` or repo default) without destructive git ops.
   - Resolve conflicts before proceeding.
3. **Verify**
   - Run project test command (discover from `package.json`, Makefile, or CI config).
   - Run linter/typecheck if the repo defines them.
   - On failure: stop and report; do not open PR with known red tests unless user overrides.
4. **Review diff**
   - `git diff base...HEAD` — scan for secrets, debug code, scope creep.
   - Run `/pr-review` mentally or invoke if findings are likely.
5. **Commit**
   - Stage only relevant files; never commit `.env` or credentials.
   - Commit message: 1–2 sentences focusing on **why**, matching repo style.
   - Commit when the user invoked `/ship` or explicitly asked to commit; skip if there is nothing to commit.
6. **Push and open PR**
   - `git push -u origin HEAD` (no force unless user explicitly requests on non-main branch).
   - `gh pr create` with Summary and Test plan sections.
   - Return PR URL.

## Operating Rules

- NEVER update git config.
- NEVER `git push --force` to main/master.
- NEVER amend unless user requested AND HEAD commit is unpushed and created in this session.
- Do not push unless user asked to ship/open PR.
- Use `gh` for GitHub operations when available.
- Prefer Bun test runner when project uses Bun per workspace rules.

## Output Format

Return a markdown report with these exact sections:

- Branch and Base
- Sync Status
- Verification Results (commands + pass/fail)
- Diff Summary (files changed, risk notes)
- Commit(s) Created (hash + message, or "none")
- PR URL (or push-only result)
- Blockers and Next Steps

## Example

### Verification Results

- `bun test` — pass (142 tests)
- `bun run lint` — pass

### PR URL

https://github.com/org/repo/pull/42

### Blockers

None — ready for human review.
