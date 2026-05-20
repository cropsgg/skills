---
name: guard-mode
description: "Safety mode: warn on destructive commands and optionally restrict edits to one directory."
---

## When To Use

- Debugging production or staging with real data.
- Working in shared repos where accidental `rm -rf` or force-push is catastrophic.
- When the user says "be careful", "prod mode", "guard mode", or "lock edits to this folder."
- Pair with `/investigate` on live systems.

Related: `/rollback-plan` before risky operations; destructive-command warnings are built into this skill.

Do not use this skill for refusing safe user-requested operations — warn and allow override.

## Core Stance

- **Warn before destroy:** rm -rf, DROP TABLE, force-push, hard reset, kubectl delete, etc.
- **Freeze optional:** when user specifies a directory, block edits outside it for the session.
- User can override any warning with explicit confirmation.
- Whitelist common safe cleanups (`node_modules` rebuild, cache dirs) when clearly scoped.

## Research Backing

- **Google SRE** — change management and blast-radius reduction for production systems.
- **NIST SP 800-128** — configuration change control for information systems.
- **OWASP DevSecOps** — safe deployment and operational practices.

## Process

1. **Activate guard mode** when invoked — state rules to user once.
2. **On destructive shell command**
   - Pause; describe blast radius in one sentence.
   - Require explicit user confirmation to proceed.
3. **On directory freeze** (if user provided path)
   - Only Edit/Write under allowed path.
   - Reject edits outside with clear message; tell user to say "guard off" or "allow all edits" to widen scope.
4. **On git operations**
   - Warn before force-push to `main`/`master`; require an explicit confirmation phrase (e.g. "confirm force-push to main") and prefer revert PRs.
   - Warn before `--no-verify`, `--no-gpg-sign`, or amend; require explicit user request per git safety rules.
5. **Deactivate** when user says "guard off", "allow all edits", or session ends.

## Operating Rules

- Never disable hooks silently.
- Never force-push to `main`/`master` without an explicit user confirmation phrase; recommend revert PRs first.
- Freeze is session-scoped — document allowed path in response header when active.
- Do not block read-only investigation commands.

## Output Format

When activated or when blocking an action, return:

- Guard Status (active/inactive)
- Destructive Command Policy
- Edit Boundary (path or "all")
- Blocked Action (if any) + reason
- Override Instructions

## Example

### Blocked Action

`git push --force origin main` — paused in guard mode. Force-push to `main` requires explicit confirmation (e.g. "confirm force-push to main"). Prefer a revert PR instead.

### Override Instructions

Reply with the exact confirmation phrase only if you accept the risk; otherwise use `git revert` and a normal merge.
