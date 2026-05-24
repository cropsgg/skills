---
name: learn
description: "Manage cumulative knowledge across sessions: review recent learnings, search for recurring patterns, prune outdated entries, export insights for upcoming sessions. Multi-session institutional memory."
---

## When To Use

- After 5+ sessions on the same project — patterns emerge that single sessions miss.
- When the agent makes the same mistake or hits the same friction point across multiple sessions.
- Before starting work in a new session — load the exported knowledge to avoid repeat mistakes.
- When the `.commandcode/learnings/` directory has accumulated entries and needs pruning.
- When the user says "what have we learned?" or "update the knowledge base."
- After `/reflect` sessions accumulate and the user wants the patterns synthesized into taste.

Related: `/reflect` for single-session retrospective (atomic unit that feeds into learn); `/session-handoff` for single-session context transfer (not cumulative); `/write-a-skill` if a pattern justifies creating a new skill.

Do not use this skill for single-session reflection (use `/reflect`). Do not use for transferring context to the next session (use `/session-handoff`). Do not use for real-time debugging (use `/investigate` or `/diagnose`).

## Core Stance

- An agent without persistent memory repeats mistakes across sessions forever. The knowledge base is a living document of patterns, fixes, friction, and taste.
- Prune aggressively — stale knowledge is worse than no knowledge. An entry that contradicts the current codebase reality must be removed or marked `[OUTDATED]`, never left to mislead.
- Patterns across sessions are the signal. A single-session observation is a note; the same observation across 3+ sessions is a pattern worth institutionalizing.
- Knowledge export is practical, not archival — the output is designed to be injected into the next session's context window, not filed away.
- Taste is auto-managed — propose patterns but never directly edit `.commandcode/taste/`. The learning system handles taste updates.

## Research Backing

- **Renze & Guven (2024)**, *Self-Reflection in LLM Agents* — structured self-reflection improves agent problem-solving accuracy; session-level reflection + cross-session pattern detection amplifies this effect.
- **Li et al. (BIGAI / Peking University, ACL 2025)**, *ReflectEvo: Iterative Self-Reflection Learning for LLM Agents* — iterative reflection improved Llama-3-8B accuracy from 52.4% to 71.2%; cross-session learning is the macro-scale equivalent of iterative reflection.
- **Packer et al. (UC Berkeley, 2024)**, *MemGPT: Towards LLMs as Operating Systems* — tiered memory with working, reference, and archival context; multi-session knowledge management as a memory tier.
- **Dhuliawala et al. (Meta FAIR, ACL 2024)**, *Chain-of-Verification* — post-hoc verification chains; applied here to validate that learnings still match the current codebase reality.

## Process

1. **Scan recent learnings**
   - Read from `.commandcode/learnings/` directory. If it doesn't exist: note that no learning history exists and suggest running `/reflect` at the end of future sessions.
   - For each entry: extract date, session context, type (mistake, friction, win, pattern, tool-issue).
   - Count entries by type to surface imbalances (e.g., 80% friction entries suggests systemic issues).

2. **Search for patterns**
   - Group entries by similarity: same file, same error message, same tool, same workflow stage.
   - Flag any pattern that appears in 3+ sessions: this is a candidate for taste or a new skill.
   - Example: "3 sessions corrected agent on API contract shape" or "4 sessions where agent suggested `useEffect` without cleanup."
   - For each pattern: write a one-sentence description, cite the session dates, and classify severity (recurring annoyance / blocking-rework / systemic-gap).

3. **Prune outdated entries**
   - For each entry: verify it still reflects the current codebase reality.
   - Check: does the referenced file still exist? Does the referenced error still occur? Has the tooling been updated?
   - Mark outdated entries `[OUTDATED — <reason>]` rather than deleting (preserve history).
   - Delete only entries that are factually incorrect (hallucinated, wrong file path) or completely superseded.

4. **Export insights for upcoming session**
   - Generate a compact export with: top patterns (≤5), open issues (≤3), tool preferences learned, files/areas to be careful with.
   - Format for context-window injection: bullet list, path-exact, ≤300 tokens.
   - Save to `.commandcode/learnings/EXPORT_YYYYMMDD.md`.

5. **Propose taste updates** (read-only)
   - If a pattern qualifies for taste (appears 3+ times, clear preference, unambiguous), describe it.
   - Format: "Prefer X over Y. Confidence: Z."
   - Do not edit `.commandcode/taste/` directly — the taste system is auto-managed.
   - Flag for user review: "Pattern detected — candidate for taste. Review and run `/write-a-skill` if this justifies a new skill."

6. **Report**
   - Summarize: entries scanned, patterns found, entries pruned, insights exported.
   - Provide the export file path for the next session.

## Operating Rules

- Never edit `.commandcode/taste/` files directly — they are managed by the learning system. Propose only.
- Never delete a learning entry without documenting why. Mark `[OUTDATED]` instead of erasing history.
- A pattern requires 3+ session observations before being proposed as taste. Single-session observations are notes.
- Verify every entry against the current codebase before marking it as still-relevant. Yesterday's learning about a file that no longer exists is noise.
- Export must be ≤300 tokens — designed for the next session's context window, not a comprehensive document.
- If `.commandcode/learnings/` is empty, don't fabricate — report "no learning history available" and recommend `/reflect`.

## Output Format

Return a markdown report with these exact sections:

- Learning History Summary (directory path, entry count, type distribution)
- Patterns Detected (≥3 sessions, with session dates, description, severity)
- Pruned Entries (entry, reason for pruning, action taken)
- Export Generated (file path, token count, top insights)
- Taste Candidates (pattern, proposed preference, confidence)
- Recommended Next Step

## Example

### Patterns Detected

1. **API contract shape mismatch** (5 sessions: May 12, 14, 17, 20, 22) — Agent consistently assumes flat API response; actual API returns `{data: {users: [...]}}`. Root cause: agent doesn't check OpenAPI spec before writing fetch logic. **Severity: systemic-gap.** **Fix: run `/api-contract-validate` before suggesting fetch code.**

2. **`useEffect` without cleanup** (3 sessions: May 10, 15, 21) — Agent suggests `useEffect` for subscriptions/event listeners without cleanup function. Root cause: React patterns default to class-component lifecycle mental model. **Severity: recurring annoyance.** **Fix: `/karpathy-rules` Gate 3 catches this.**

### Export Generated

`.commandcode/learnings/EXPORT_20260524.md` — 245 tokens.
Top insight: "Always verify API response shape with /api-contract-validate before writing fetch. API uses nested `{data: {...}}` format."

### Taste Candidates

1. "Prefer running `/api-contract-validate` before writing any fetch logic." Confidence: 0.85. Pattern observed in 5 sessions.

### Recommended Next Step

Review taste candidate. If approved, taste system will auto-apply. Run `/write-a-skill` to create `response-shape-verify` if the OpenAPI check deserves its own skill.
