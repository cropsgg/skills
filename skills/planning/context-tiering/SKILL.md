---
name: context-tiering
description: "Manage context window as tiered memory: working (active, immediate access), reference (indexed, retrievable), and archival (compressed, summarized). Based on MemGPT/Letta tiered memory architecture."
---

## When To Use

- When context window utilization exceeds 60% and critical information is getting dropped.
- During long sessions (>20 turns) where early context is needed but the window is filling.
- When working across multiple files/modules and the agent needs to keep context on all of them.
- Before a context reset — promote essential reference material to the reference tier so it survives.
- When the user says "remember this for later" or "we'll need this context next session."
- When session costs are high and tiering can reduce token waste on redundant re-explanation.

Related: `/session-handoff` for compact context transfer to the next session; `/caveman` for token-efficient output formatting; `/reflect` for session-level learning capture; `/learn` for multi-session knowledge management.

Do not use this skill for sessions <10 turns, for trivial exchanges, or when context window utilization is <40% with no growth trend. Premature tiering adds overhead without benefit.

## Core Stance

- Context windows are flat, but memory should be hierarchical. What can't fit in working memory must be structured into retrievable tiers, not lost on context rotation.
- Tiering is proactive, not reactive. Promote and demote elements before the window fills, not after critical context has already been evicted.
- The archival tier is the safety net — it preserves compressed representations that can be expanded on retrieval. Lossy compression is acceptable; total loss is not.
- Reference tier is indexed and searchable. The agent must be able to retrieve elements by key, path, or concept without re-reading the entire reference store.
- Working memory is precious — keep it lean. If something hasn't been referenced in 5+ turns, demote it.

## Research Backing

- **Packer et al. (UC Berkeley, 2024)**, *MemGPT: Towards LLMs as Operating Systems* — tiered memory architecture for LLMs: working context (active), main memory (retrievable), and archival storage (compressed). MemGPT demonstrated that tiering extends effective context by 10–50× on long-running agent tasks.
- **Letta/MemGPT Architecture** — practical implementation of virtual context management: prompt chaining for context overflow, function calling for memory read/write/search, and compressed summaries for archival storage.
- **Renze & Guven (2024)**, *Self-Reflection in LLM Agents* — context window economics: filler and redundant information reduce effective agent working memory. Tiering addresses this by deduplication and compression.

## Process

1. **Classify current context elements**
   - Scan the current conversation. Tag each discrete element by tier:
     - **Working:** actively discussed, modified, or needed for the immediate next turn.
     - **Reference:** files read, commands run, decisions made — important but not currently active.
     - **Archival:** early context, completed tasks, closed decisions — needed for audit trail but not for immediate action.
   - Categorize: file paths, command outputs, decisions, hypotheses, errors, config values, API contracts.

2. **Establish the tier structure**
   - Working: the current conversation turn + the last 3 exchanges (minimal, high-signal).
   - Reference: structured index file at `.commandcode/context/reference/index.md` with searchable keys (file path → summary, decision → rationale, error → fix).
   - Archival: compressed summaries at `.commandcode/context/archival/YYYYMMDD_turn-<range>.md` — one file per ~20 turns, key-value summaries only.

3. **Compress archival elements**
   - For each completed task or closed decision: reduce to a 1–2 sentence summary.
   - Format: "Decision: [what]. Rationale: [why]. Evidence: [file:line or command output excerpt]."
   - Delete from the archival summary: conversational filler, back-and-forth negotiation, debugging dead ends that were refuted.
   - Preserve: file paths, error messages, fix commits, config values changed.

4. **Build/update the reference index**
   - Reference tier is a single index file mapping search keys to content locations.
   - Format per entry: `[key]` → `[type: file|decision|config|error]` → `[location: path or archival file]` → `[1-line summary]`.
   - Keys: file paths, function names, config keys, error codes, decision slugs.
   - Keep the index at the top of the reference tier — it's the first thing retrieved.

5. **Monitor context utilization**
   - At each turn boundary: estimate context window utilization.
   - At 60%: begin promoting working-to-reference (move inactive elements to index).
   - At 75%: begin promoting reference-to-archival (compress rarely accessed entries).
   - At 90%: critical — demote aggressively, keep only immediate working set.

6. **Retrieve from tiers**
   - Before reading a file that was previously read: check reference index first. If found, retrieve the summary + location. Re-read the file only if the summary is insufficient or outdated.
   - Before repeating a decision: check reference index for prior decision on the same topic.
   - When user asks "what did we decide about X?": search reference index by key, then expand from archival summary if needed.

7. **Maintain the tier map**
   - At session end: write the final tier map to `.commandcode/context/tier-map.md`.
   - This is the entry point for the next session's `/session-handoff` or `/context-tiering` invocation.
   - Tier map format: working set, reference index path, archival file list, session summary.

## Operating Rules

- Tiering is proactive — don't wait for context overflow. Start tiering at 60%.
- Never delete context without writing it to a retrievable tier. Loss is acceptable; destruction is not.
- The reference index must be searchable by a human or agent in <10 seconds. If the index needs a full read to search, it's too long.
- Archival compression is lossy but must preserve: file paths, error messages, fix commits, config changes. Everything else is candidate for compression.
- Don't tier too aggressively — if context is at 35% and stable, tiering is overhead.
- The tier map file is the bridge between sessions. Always write it at session end when tiering is active.

## Output Format

Return a markdown report with these exact sections:

- Context Window Status (utilization %, trend)
- Tier Distribution (working elements, reference entries, archival files)
- Working Set (active elements only)
- Reference Index Updated (new entries, modified entries)
- Archival Compression (turns compressed, tokens saved)
- Tier Map Path
- Recommended Next Promotion/Demotion (when context reaches N%)

## Example

### Context Window Status

- Utilization: 68% (trending +3% per turn)
- Active elements: 12 (files open, current task, recent outputs)

### Tier Distribution

- Working: 5 elements (current file edit, last 3 exchanges)
- Reference: 18 entries (files read, commands run, decisions)
- Archival: 3 files (turns 1–15, turns 16–30, turns 31–45)

### Reference Index Updated

New entries:
- `[src/routes/checkout.ts]` → `[file]` → `[archival/turns_1-15.md]` → `[Checkout route: POST /api/checkout, coupon validation at L142]`
- `[decision: idempotency-key]` → `[decision]` → `[archival/turns_16-30.md]` → `[Add idempotency key to webhook handler before retry logic. Rationale: duplicate webhook = double charge.]`

### Archival Compression

Compressed turns 1–15: 4,200 → 850 tokens (80% reduction). Preserved: 3 file paths, 2 error messages, 1 fix commit.

### Tier Map Path

`.commandcode/context/tier-map.md`

### Recommended Next Promotion/Demotion

At 75% utilization (est. 3 turns): promote `src/routes/checkout.ts` summary to archival. Keep only active edit in working set.
