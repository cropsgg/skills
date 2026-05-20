---
name: btw
description: >-
  Side-channel Q&A without polluting the main thread. Spins a background sub-agent
  to investigate the codebase, run shell commands, or look up docs/web when needed.
  Returns raw answer only. Use when the user sends /btw, "btw", or asks a side
  question while another task is in progress.
disable-model-invocation: true
---

## When To Use

- User sends `/btw <question>` or clearly marks a message as a side question during active work.
- The question needs **new** information: repo search, shell output, web/docs lookup, or fresh analysis.
- User `@`-mentions files, folders, or URLs that should seed the investigation.
- User wants an answer without filling the main thread with tool transcripts and reasoning chains.

Do not use this skill for questions answerable purely from the current conversation (names, decisions, or paths already stated in-thread). Answer those inline with **raw answer only** — no sub-agent.

## Core Stance

- Protect the main thread: the parent agent must not narrate sub-agent work, tool calls, or intermediate findings.
- `/btw` is the **tool-enabled complement** to Claude Code's built-in `/btw` (context-rich, no tools). Here: isolated worker with read + shell + web, minimal return surface.
- Conversation history **may** be summarized for the sub-agent; it must **never** be replayed wholesale into the main thread on return.
- If the main task was in progress when `/btw` fired, **keep going** after starting the background worker. Do not block on the side question.

## Research Backing

- **Claude Code `/btw` (Anthropic, 2025–2026)** — ephemeral side Q&A designed to avoid context pollution and workflow interruption; documented limitation: no tool access, full in-thread context only.
- **Complementary agent split (Claude Code ecosystem practice)** — recall from known context vs delegate discovery to an isolated worker; only the worker's conclusion crosses the boundary.
- **Agent context economics** — long tool traces and exploratory narration in the primary thread reduce effective working memory for the main task; side channels with compact returns are standard mitigation in multi-agent coding workflows.

## Process

### 1. Parse the side question

Extract everything after `/btw` (or the explicit side-question marker). Collect any `@`-mentioned paths, URLs, or symbols the user attached.

### 2. Triage: inline vs background sub-agent

**Answer inline (no Task)** when ALL are true:

- The answer is already in the current conversation (prior assistant/user messages).
- No file read, search, shell command, or web lookup is required.
- No new architectural analysis beyond restating what was already agreed.

**Use background sub-agent** when ANY are true:

- Codebase search, file read, or git/shell inspection is needed.
- External docs or web lookup would help.
- Fresh analysis (architecture opinion, comparison, debugging hypothesis) is requested.
- User `@`-mentioned artifacts that were not already fully loaded in-thread.

### 3. Inline path (recall only)

Respond with **only** the answer text. No preamble ("Sure!", "Based on our chat…"), no headers, no bullet wrapper unless the answer itself requires bullets.

### 4. Background sub-agent path

Launch **one** background Task:

| Parameter | Value |
|-----------|--------|
| `run_in_background` | `true` |
| `subagent_type` | `generalPurpose` |
| `readonly` | `false` (read + shell; **no file writes** unless user explicitly asks to change code in the `/btw` prompt) |

**Sub-agent prompt must include:**

1. The user's exact `/btw` question.
2. Every user `@`-mentioned path, URL, or symbol.
3. A **short** briefing (≤15 bullets): what the main task is doing, relevant decisions, and any constraints — distilled from conversation history, not a full transcript paste.
4. Workspace root / repo context if known.

**Sub-agent operating rules (put in the Task prompt):**

- Investigate with read, search, and shell as needed; use web fetch/search for docs or references when helpful.
- Do **not** edit files unless the `/btw` question explicitly requests a change.
- Do **not** return tool logs, step lists, or reasoning chains.
- Return **only** the final answer the parent should show the user — plain text, ready to paste.

**Parent agent while sub-agent runs:**

- Do not tell the user you "started a sub-agent" unless they asked for status.
- If there is ongoing main work, continue it immediately after dispatching `/btw`.
- Do not poll or re-launch duplicate Tasks for the same question.

### 5. When the background Task completes

Surface **only** the sub-agent's final answer string in the main thread:

- Raw answer only.
- No wrapper like "BTW:" unless the user prefers it — default is **no label**.
- Strip any meta the sub-agent added ("Here's what I found", "I searched…", file inventory). Keep substantive facts that belong in the answer itself.

If the sub-agent failed or returned empty, one line is allowed: state that `/btw` could not resolve the question and give the single most useful blocker — still no tool dump.

## Operating Rules

- **Never** paste sub-agent tool transcripts, search results, or long code blocks into the main thread unless the user's question *is* "show me the code" and a minimal snippet is the answer.
- **Never** merge the `/btw` answer into the main task plan unless the user explicitly asks to act on it.
- Prefer `explore` over re-reading the entire repo when the question is narrow; still use `generalPurpose` when shell or web is needed.
- One `/btw` → one background Task. Batch unrelated side questions only if the user listed them in one `/btw` prompt.
- Default to **read + shell**, not writes. Side questions are for learning, not drive-by edits.

## Output Format

**Main thread output is always raw answer only** — a string the user can read and dismiss, like Claude Code's `/btw` overlay answer.

Forbidden in the main thread response:

- "I'll look into that…" / "Let me search…"
- Sub-agent status narration
- Tool call summaries
- "Let me know if you want me to…"

Allowed when essential to the answer itself:

- A short code snippet
- A file path or command inline in the answer
- A numbered list if the question demanded enumeration

## Example

**User (mid-refactor):** `/btw where is SessionMiddleware actually mounted? @src/server`

**Parent:** dispatches background Task with question + `@src/server` + brief "we're refactoring auth module" context; continues the refactor.

**Sub-agent:** greps and reads files; returns internally: `SessionMiddleware is mounted in src/server/app.ts line 84 via app.use(sessionMiddleware) before the /api router.`

**Parent (when Task completes):** posts only:

```
SessionMiddleware is mounted in src/server/app.ts line 84 via app.use(sessionMiddleware) before the /api router.
```

**User (recall):** `/btw what did we decide for the session store?`

**Parent (inline, no Task):** `Redis with a 24h TTL — you chose that over in-memory because multi-instance deploys need shared sessions.`
