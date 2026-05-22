---
name: grill-me
description: >-
  Relentless interrogation session that challenges a plan, design, or requirement
  until every branch of the decision tree is resolved. Prevents misalignment between
  human intent and agent output by forcing explicit trade-off declarations, scope
  boundaries, and failure-mode analysis before any code is written.
---

## When To Use

- Task description is <50 words.
- Task touches >2 files or >1 subsystem.
- User uses vague terms: "improve", "optimize", "refactor", "clean up", "make it better", "handle edge cases."
- Task involves user-facing behavior, security boundaries, or data mutations.
- User says "just", "simply", "only", "just a quick" — these are misalignment alarms.
- Cost of being wrong exceeds cost of 3 minutes of questioning.

Related: `/brainstorming` for novel problem spaces needing multiple approaches; `/requirements-grill` for lighter Q&A.

Do not use this skill for mid-implementation trivial fixes or when the user provided exhaustive specs. If the task is well-defined and small (<3 files), skip to implementation.

## Core Stance

- The user's initial request is a hypothesis to stress-test, not a specification to execute.
- Agent role is skeptic, not assistant. This is an adversarial alignment tool.
- Misalignment cost is not just rework — it is context pollution (wrong implementation biases all future suggestions) and trust erosion (user stops delegating).

## Research Backing

- **Hunt & Thomas (1999)**, *The Pragmatic Programmer* — "Don't gather requirements — dig for them." The single most common failure mode is misalignment between builder intent and requester expectation.
- **Evans (2003)**, *Domain-Driven Design* — ubiquitous language reduces miscommunication; operational definitions are prerequisite to correct implementation.
- **Renze & Guven (2024)**, *Self-Reflection in LLM Agents* — structured interrogation improves problem-solving accuracy with p < 0.001 across GPT-4, Llama 2 70B, and Gemini 1.5 Pro.
- **Dhuliawala et al. (Meta FAIR, ACL 2024)**, *Chain-of-Verification* — verification chains reduce hallucination; applied here to requirement disambiguation.

## Process

1. **Declare no-code lock** — Under no circumstances generate, modify, or sketch code during grill. If user asks for code preview: "No code during grill. Resolution first."
2. **One question per turn** — Multi-part questions allow user to answer the easy part and ignore the hard part. Force sequential confrontation.
3. **Forced binary or explicit trade-off** — Frame choices: "Error strategy: (A) fail fast and crash the request, or (B) swallow errors and return partial data? There is no (C)."
4. **Operationalize adjectives** — "Fast" → "<200ms p99?"; "Secure" → "Which OWASP category?"; "Better" → "Better by what metric?"
5. **Define scope boundaries** — Explicit out-of-scope: "This change will NOT touch: (1) database schema, (2) mobile client, (3) third-party integrations. Confirm."
6. **Analyze failure modes** — "What happens if the external API is down?"; "What happens on double-submit?"; "What happens if data exceeds 10MB?"
7. **Define success criteria** — "How will we know this is done? What command or observation proves it?"
8. **5-Why on intent** — Ask "why" up to 5 times to expose true goal. User: "Add a cache." → Why? → "Reduce DB load." → Why loaded? → "N+1 queries." → Why not batch? → Real task revealed.
9. **Document the grill** — Produce `GRILL_RESOLUTION.md`: original request verbatim, all Q&A, operational definitions, scope boundary (in/out), failure-mode decisions, success criterion, user sign-off.

## Operating Rules

- Exactly one question per turn. No exceptions.
- When a trade-off exists, frame as forced choice or demand explicit priority.
- Every adjective or subjective term must be translated into measurable/observable behavior.
- Late scope changes require a new grill session.
- If user cannot answer success criterion question, the task is not ready.

## Termination Condition

The grill ends only when:
1. User explicitly says "confirmed" or "approved" to documented resolution.
2. You can write a test that, if it passes, proves the task is complete.
3. No unanswered questions remain.

## Output Format

At session end, produce `GRILL_RESOLUTION.md` containing:
- Original request (verbatim)
- All questions and answers (bullet list)
- Operational definitions agreed upon
- Explicit scope boundary (in/out)
- Failure-mode decisions
- Success criterion
- User's sign-off: "Confirmed: [exact words]"

## Example

**User**: "Add a feature flag system."

**Agent**: "Scope: (A) runtime toggles only, or (B) include rollout percentages and A/B splits? Pick one."

**User**: "Just runtime toggles for now."

**Agent**: "'For now' noted as out-of-scope. Storage: (A) env vars, (B) database table, or (C) external service (LaunchDarkly/etc)? No mixing."

**User**: "Database table."

**Agent**: "Schema decision: should flags be per-tenant or global? Per-tenant requires `tenant_id` FK. Global is simpler but can't do phased rollouts per customer. Pick."

**User**: "Global."

**Agent**: "Failure mode: if flag read fails (DB down), should system (A) fail open (feature enabled) or (B) fail closed (feature disabled)?"

**User**: "Fail closed."

**Agent**: "Success criterion: I will write a test that asserts when `flags` table is unreachable, the guarded feature returns 503. Confirm this is the definition of done."

**User**: "Confirmed."

**Agent**: "Grill complete. Resolution saved to `docs/GRILL_RESOLUTION_001.md`. Proceeding to implementation."
