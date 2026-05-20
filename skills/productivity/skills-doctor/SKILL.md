---
name: skills-doctor
description: "Diagnose and fix: agent/skills setup, toolchain, app smoke, deep debug — apply fixes in-session when evidenced, else hand off to investigate."
---

## When To Use

- Skills or slash commands are missing, shadowed, or stale after install.
- The agent ignores project rules, memory files, hooks, or MCP tools you configured.
- Dev server won't start, tests fail, build errors, or "it worked yesterday."
- User provides a specific error, stack trace, or "debug this: …" — start here even if the layer is known.
- Before `/investigate` when root cause is not yet proven.

Related: `/investigate` for confirmed application logic defects after this skill's evidence pass; `/health-check` for non-incident quality baselines; `/regression-check` after a fix.

Do not use this skill for scheduled quality scoring — use `/health-check`; do not use for pre-merge diff review — use `/pr-review`.

## Core Stance

- **One skill, two phases:** triage every layer first, then deep-debug the failing symptom in the same session — do not stop after the verdict table if failures remain.
- Every triage check returns **OK**, **WARN**, or **FAIL** with command output or path evidence.
- Collect an **evidence bundle** before app logic changes: repro command, logs, git state, env key names.
- **Fix in session** — when a check fails and the fix is clear, apply it (edit files, run install commands, refresh skills), then re-verify. Do not stop at recommendations unless the user must act (secrets, host UI, destructive ops).
- **Safe fixes (always apply when evidenced):** config, hooks, MCP JSON, `.env.example` gaps, scripts, dependency install, skill reinstall, port/process conflicts, typo-level code errors pointed to by stack trace.
- **Application fixes (apply when root cause is evidenced):** minimal targeted patch when logs/tests name file, line, and failure mode — e.g. missing export, wrong import path, null guard on proven path, off-by-one in reproducing test. One hypothesis, one change, re-run repro.
- **Escalate to `/investigate`** only when root cause is still ambiguous after three evidenced fix attempts, or the fix requires non-trivial logic/design change.
- Cannot read live in-session context; when the host exposes native slash diagnostics, ask the user to run them and paste output.
- Time-box commands: triage smoke ~60s, deep repro ~120s; report timeout as FAIL with partial output.

## Research Backing

- **Google SRE — Troubleshooting** — narrow blast radius by layer before deep investigation.
- **ITIL 4** — incident categorization and routing before remediation.
- **Agans (2002)**, *Debugging: The 9 Indispensable Rules* — stabilize repro, change one variable at a time.
- **Beyer et al. (Google, 2016)**, *Site Reliability Engineering* — controlled experiments under uncertainty.
- **ISO/IEC/IEEE 29119** — structured repro steps with expected vs actual.

## Process

### Phase 1 — Triage (always run)

1. **Intake**
   - Symptom in one sentence; cwd; what changed recently (pull, install, env, deploy).
   - Detect host: check for `cmd`, `claude`, `cursor`, `codex` on PATH and config dirs under home (see project `docs/HOST_REFERENCE.md` when available).
2. **Agent layer**
   - **Host CLI (when present):** run status/list commands (e.g. `cmd skills list`, `cmd status`).
   - **Skills on disk:** verify folder + `SKILL.md` layout — not a lone `.md` file (e.g. `~/.commandcode/skills/<name>/SKILL.md`).
   - **Disabled skills:** read host settings JSON for `disabledSkills` or equivalent.
   - **Context files:** confirm `CLAUDE.md`, `AGENTS.md`, or host context file exists where expected.
   - **Hooks:** under `"hooks"` in settings JSON; `matcher` is a string (e.g. `"Edit|Write"`), not an array; tool names capitalized (`Bash`, `Edit`).
   - **MCP:** repo-root `.mcp.json`; absolute paths for local script commands.
   - **Native introspection (user action):** ask user to run host slash menus for skills/context/hooks/MCP and paste output if needed.
3. **Toolchain layer**
   - Runtimes: `bun --version`, `node --version`, `python3 --version` as applicable.
   - Dependencies: lockfile vs `node_modules` / venv.
   - Environment: compare `.env.example` keys to `.env` **names only** — never print secret values.
   - Ports: `lsof -i :PORT` or equivalent when dev port is known.
4. **App smoke layer**
   - Discover scripts from `package.json`, Makefile, `pyproject.toml`, or CI workflow.
   - Run shortest signal: typecheck, lint, or fast unit test subset.
   - Capture exit code and last ~20 lines stderr/stdout.
5. **Verdict matrix + fix pass**
   - Table: Check | Status (OK/WARN/FAIL) | Evidence | Fix | Verify.
   - For every **FAIL** in agent/toolchain layers with a known fix: **apply the fix now**, then re-run the verify column before Phase 2.

### Phase 2 — Deep debug (run when any FAIL/WARN affects the symptom, or user supplied an error)

6. **Focus contract**
   - Expected vs actual in one sentence each; quote user error or stack trace.
7. **Enable logging (user action)**
   - Instruct host-native debug logging when supported, or app verbosity (`DEBUG=*`, `LOG_LEVEL=debug`).
   - Re-run repro; capture new log tail.
8. **Evidence bundle**
   - Minimal repro command; `git status --short`, `git log -5 --oneline`, branch.
   - Env var **names** vs `.env.example`; last ~50 lines of log or test output.
9. **Rank hypotheses**
   - 3–5 falsifiable causes ordered by likelihood; each testable in one step.
10. **Fix attempt (apply, don't just suggest)**
    - **Infrastructure:** script/config typo, `.env.example` gap, `bun install`, port/process kill, JSON repair, skill reinstall — apply directly.
    - **Application (evidenced only):** patch the file/line the error names; add missing export/import; fix failing assertion when test output is unambiguous.
    - **Ask first:** deleting data, force-push, prod config, credential values, changes touching >3 files without a clear single cause.
11. **Verify**
    - Re-run repro; record pass/fail and output delta. If still failing, revert or iterate with the next hypothesis.
12. **Escalate or close**
    - Ambiguous after three evidenced attempts → `/investigate` with Focus Contract + Evidence Bundle + dead hypotheses.
    - Resolved → summarize what was changed (files/commands) and suggest `/regression-check` if application code changed.

## Operating Rules

- Do not stop after Phase 1 if the user's symptom is still unexplained — continue to Phase 2 automatically.
- Run read-only checks first; then apply fixes — prefer acting over advising when risk is low.
- Never echo `.env` values, tokens, or credentials.
- Do not large-scale refactor or guess business rules; minimal evidenced patches are in scope for this skill.
- Prefer Bun when the project uses Bun per workspace rules.
- If three fix attempts fail in Phase 2, stop and escalate — do not loop blindly.
- Mark checks `[UNVERIFIED]` when CLI missing, no network, or timeout.

## Output Format

Return a markdown report with these exact sections:

- Symptom Summary
- Host Detected
- Phase 1 — Agent Layer Results
- Phase 1 — Toolchain Results
- Phase 1 — App Smoke Results
- Phase 1 — Verdict Table (Check | Status | Evidence | Fix | Verify)
- Phase 2 — Focus Contract (skip section if Phase 1 fully resolved symptom)
- Phase 2 — Evidence Collected
- Phase 2 — Hypotheses
- Phase 2 — Fix Applied
- Phase 2 — Verification
- Escalation (if any)
- Recommended Next Step

## Example

### Phase 1 — Verdict Table

| Check | Status | Evidence | Fix | Verify |
|-------|--------|----------|-----|--------|
| Skills installed | FAIL | `cmd skills list` shows 13, expect 36 | Applied: `cmd skills add cropsgg/skills --global --force` | OK — 36 listed |
| Typecheck | FAIL | `src/api.ts:12` — `User` not exported from `./types` | Applied: add export in `types.ts` | OK — typecheck passes |

### Phase 2 — Fix Applied

Added `export type User` to `src/types.ts`; re-ran `bun run typecheck` — exit 0.

### Recommended Next Step

Run `/regression-check` before commit.
