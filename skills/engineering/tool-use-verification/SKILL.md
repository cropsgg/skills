---
name: tool-use-verification
description: "Pre-flight and post-flight checklist for every tool invocation. Verify scope, safety, and idempotency before running. Verify output matches expectations, no side effects, and error handling worked after. Tool calls are the agent's primary write surface."
---

## When To Use

- Before and after any tool invocation that modifies state (Edit, Write, shell commands, git operations).
- When running commands in production, staging, or shared environments.
- When a tool call's blast radius is uncertain or the operation is non-reversible.
- After a previous tool call had an unexpected outcome — run the post-flight on the next call more carefully.
- When the user has `/guard-mode` active and overrides are being verified.

Related: `/adversarial-self-test` for security-focused output testing; `/chain-of-verification` for factual claim verification; `/karpathy-rules` for code output quality gates; `/diagnose` when a tool call failure needs root cause analysis.

Do not use this skill for read-only operations (Read, Grep, Glob) unless the user explicitly asks. The pre-flight/post-flight overhead isn't justified for safe reads. Do not use for purely conversational output.

## Core Stance

- Tool calls are the agent's primary write surface to the outside world. Every one changes state — a file on disk, a running process, a git history. Audit every write.
- The checklist is fast: 4 questions pre-flight, 4 questions post-flight. If the checklist takes longer than the tool call, the checklist is too detailed.
- Idempotency is a safety property, not a nice-to-have. If the same command run twice produces a different or harmful result the second time, it's not idempotent and warrants a warning.
- The post-flight check is not optional. The tool said it succeeded — did it? The tool produced output — is it what we expected?
- Failures in tool calls are not the end — they're the beginning of diagnosis. A failed post-flight check triggers investigation, not a retry.

## Research Backing

- **Anthropic (2025)**, *Tool Use Best Practices* — pre-flight validation and post-flight output checking reduce unsafe tool invocations; structured verification of tool outputs prevents cascading errors from incorrect tool results.
- **OpenAI (2024)**, *Function Calling Guide* — post-flight output validation pattern: verify the returned data matches expected schema, handle tool call errors gracefully, and never assume tool output is correct without checking.
- **Shinn et al. (Princeton, 2024)**, *Reflexion: Language Agents with Verbal Reinforcement Learning* — post-hoc verification loops improve agent safety; applying verification specifically to tool call outputs catches the most dangerous failure mode (incorrect tool execution propagating downstream).

## Process

1. **Pre-flight checklist** (before every write/mutate tool call)
   - **Scope:** does the file/directory exist? Is the target correct? Will this affect only intended files?
   - **Safety:** is this operation safe? Could it delete data, corrupt state, or expose secrets? Is `/guard-mode` active and would it block this?
   - **Idempotency:** if this command runs twice, is the second run safe? For edits: is `oldValue` unique in the file? For shell: can the command be run again without harm?
   - **Expected outcome:** what should happen if this succeeds? What's the expected output? What's the expected state change?
   - **Gate:** if any pre-flight question has a concerning answer, flag it and ask for user confirmation. If all pass: execute.

2. **Execute the tool**
   - Run the tool call as planned.
   - Record: tool name, parameters (or parameter hash), start time.

3. **Post-flight checklist** (immediately after every write/mutate tool call)
   - **Output match:** did the tool produce the expected output? For shell: correct exit code? Expected stdout/stderr? For edit: expected number of replacements?
   - **Side effects:** did the tool modify anything unexpected? For shell with `rm` or `mv`: only the intended files? For edit: did it replace the correct occurrence?
   - **Error handling:** if the tool reported an error, was it handled? If the tool succeeded but the output is unexpected, is there a recovery path?
   - **Impact verification:** read back the affected file or check the system state to confirm the change is what was intended.
   - **Gate:** if any post-flight check fails: escalate. Do not retry without understanding the failure.

4. **Log the result**
   - Record: tool, pre-flight status, post-flight status, any anomalies.
   - If a pre-flight warning was overridden by the user: note the override.
   - If a post-flight check failed: note the failure, the attempted recovery, and the final state.

5. **On failure — escalate, don't guess**
   - Do not retry a failed tool call with different parameters without understanding why it failed.
   - If the failure is in the output (tool succeeded, output is wrong): investigate the tool's behavior. Did `oldValue` match something unexpected?
   - If the failure is a crash/timeout: check the environment. Is the file locked? Is the process still running?

## Operating Rules

- Run the pre-flight on every write/mutate tool call. No exceptions for "I know this file."
- The pre-flight must complete before the tool call. Don't call the tool and then ask "was that safe?" — ask first.
- "Idempotent" means "safe to run twice" — not "same output." A `git commit` is not idempotent (creates a second commit). Flag non-idempotent commands.
- Read-back verification is the gold standard for post-flight. Don't trust the tool's success message — check the file.
- If a post-flight check reveals a discrepancy: escalate immediately. "The edit said it replaced 1 occurrence, but I see 0 changes in the file" — this is a diagnostic emergency, not a shrug.
- Don't use the checklist to slow down safe operations. A `mkdir -p` of a known non-existing directory doesn't need full verification.

## Output Format

Return a markdown report with these exact sections:

- Tool Call (type, target, parameters summary)
- Pre-Flight Status (scope, safety, idempotency, expected outcome — PASS/FLAG per question)
- Execution Result (exit code, output excerpt, duration)
- Post-Flight Status (output match, side effects, error handling, impact verification — PASS/FAIL per question)
- Anomalies (if any)
- Recovery Actions (if applicable)
- Overall Verdict (SAFE / FLAGGED / FAILED)

## Example

### Tool Call

`edit_file` on `packages/cart/src/checkout.ts:142` — replace `applyDiscount(cartSnapshot)` with `applyDiscount(cartSnapshot, { validateCoupon: true })`.

### Pre-Flight Status

| Check | Status | Detail |
|-------|--------|--------|
| Scope | PASS | File exists at `packages/cart/src/checkout.ts`. Only L142 targeted. |
| Safety | PASS | Edit is additive (adds options param). No data loss. |
| Idempotency | PASS | `oldValue` (`applyDiscount(cartSnapshot)`) appears once — unique match. Second run would find no match (harmless). |
| Expected Outcome | PASS | L142 should read `applyDiscount(cartSnapshot, { validateCoupon: true })`. 1 replacement expected. |

### Execution Result

Exit: success. Edit reported: "1 replacement(s) made."

### Post-Flight Status

| Check | Status | Detail |
|-------|--------|--------|
| Output Match | PASS | 1 replacement as expected. |
| Side Effects | PASS | Only L142 modified. Grep confirms: `applyDiscount(cartSnapshot)` no longer exists in file. |
| Error Handling | PASS | No errors reported. |
| Impact Verification | PASS | `read_file checkout.ts:140-145` confirms: `applyDiscount(cartSnapshot, { validateCoupon: true })` at L142. |

### Overall Verdict

**SAFE** — all pre-flight and post-flight checks passed. Edit verified by read-back.
