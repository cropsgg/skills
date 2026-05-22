---
name: git-worktree
description: >-
  Manage parallel git worktrees for isolated feature development, code review,
  and hotfix branches. Routes all git operations through a manager protocol
  that handles .env copying, port isolation, and dependency drift detection.
  Prevents cross-branch pollution and accidental commits to the wrong branch.
---

## When To Use

- Need to review a PR while working on a feature.
- Need to test a hotfix on `main` without disturbing your feature branch.
- Need to run two versions of the app side-by-side (e.g., old vs new API).
- User says "check out this branch" while there are uncommitted changes.
- About to run a long-running task (build, test suite) and need to do other work in parallel.

Related: `/ship` for final merge workflow; `/investigate` for debugging on a separate branch.

Do not use this skill for simple `git stash && git checkout` workflows where only a quick file read is needed. Not suitable for monorepos with deeply interdependent packages without additional config.

## Core Stance

- `git stash && git checkout` is error-prone and destroys state. Cloning the repo multiple times wastes disk space and drifts out of sync.
- `git worktree` allows multiple branches to coexist in separate directories while sharing one `.git` object database.
- Without protocol, worktrees create chaos: `.env` files don't copy, `node_modules` drift, ports conflict, `.gitignore` rules differ per branch.

## Research Backing

- **Git documentation (kernel.org)** — `git worktree` is the canonical mechanism for parallel branch checkout; official support since Git 2.5 (2015).
- **Hunt & Thomas (1999)**, *The Pragmatic Programmer* — "Version Control as a Time Machine": isolation of parallel workstreams reduces merge conflict surface area.
- **Forsgren et al. (2018)**, *Accelerate* — trunk-based development with short-lived branches correlates with elite DevOps performance; worktrees enable fast context switching within trunk-based workflows.

## Process

1. **Create worktree** — `git worktree add .worktrees/[type]-[desc] [branch]`. Types: `feature`, `review`, `hotfix`, `spike`, `release`.
2. **Copy environment files** — `.env`, `.env.local`, `.env.development` from root to worktree if they exist.
3. **Install dependencies** — Run `npm install` (or `pnpm`/`yarn`) inside the worktree if `package.json` exists.
4. **Assign port** — If root uses port 3000, assign 3001, 3002, etc. Update worktree `.env` with new port. Maintain `PORT_REGISTRY.md`.
5. **Update .gitignore** — Add worktree-specific patterns: `.worktrees/*/.env`, `.worktrees/*/node_modules`, `.worktrees/*/.next`, `.worktrees/*/dist`.
6. **Verify readiness** — `git branch --show-current` returns expected branch. `git status` shows clean state. Assigned port is free. `npm start` launches without errors. Smoke test returns 200.

### Dependency Drift Detection
Before switching to a worktree unused >24 hours:
1. Check if root `package.json` changed since worktree creation (compare `git log` timestamps).
2. If root is newer, re-install in worktree.
3. If lockfiles differ, re-install.

### Clean Deletion Protocol
1. `git worktree remove .worktrees/[name]` (or `--force` if uncommitted changes).
2. If branch was temporary, `git branch -D [branch]`.
3. Remove entry from `PORT_REGISTRY.md`.
4. Run `git worktree prune`.

## Operating Rules

- Never `git checkout` inside a worktree to a branch checked out in another worktree.
- Never commit to `main` from a feature worktree unless explicitly doing a hotfix.
- Never copy `node_modules` between worktrees (symlinks acceptable if package manager supports).
- Never assume `.env` variables are the same across worktrees — always verify.
- When switching between worktrees: announce the switch, verify branch, verify no uncommitted changes in previous worktree (or stash with explicit message), re-read context files.
- Always prefix test/build/dev commands with worktree path or run from inside it — not from root.

## Output Format

Maintain at `.worktrees/PORT_REGISTRY.md`:
```markdown
| Worktree | Branch | Port | Status |
|----------|--------|------|--------|
| feature-auth-refactor | auth-refactor | 3001 | active |
| review-pr-447 | pr-447 | 3002 | active |
```

On worktree creation, announce:
```
Worktree `.worktrees/[name]/` ready on port [N].
Branch: [branch]
Verification: `git branch --show-current` returns [branch], smoke test passes.
```

## Example

**User**: "Review PR #447 while I keep working on my auth branch."

**Agent**: Creates `.worktrees/review-pr-447/` from PR branch, copies `.env`, assigns port 3002, installs deps, verifies smoke test. User can now `cd .worktrees/review-pr-447 && npm run dev` while auth branch continues in root.
