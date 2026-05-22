---
name: reflect
description: >-
  End-of-session retrospective that scans the full conversation for mistakes,
  friction points, and wins. Cites specific exchanges, proposes ranked
  improvements, and audits skills used for token efficiency. Captures
  institutional knowledge before context is lost.
---

## When To Use

- End of any session >10 turns.
- After resolving a non-trivial bug.
- After a failed implementation attempt (even if the second attempt succeeded).
- After introducing a new skill or tool to the workflow.
- User says "wrap up", "done for now", or "let's pause."

Related: `/session-handoff` for compact context transfer; `/self-audit` for per-change defect detection.

Do not use this skill mid-session or for trivial exchanges where no learning occurred. Skip for sessions <5 turns unless a significant mistake was made.

## Core Stance

- Agents lose their memory when the session ends. Humans forget debugging details within 48 hours. Same mistakes, friction points, and "aha moments" are repeated endlessly unless captured.
- Reflect is a learning artifact for the next agent, the next human, and the next session — not a summary for the user (though the user may read it).
- Organizations that do not capture this knowledge are doomed to re-learn it at full cost every time.

## Research Backing

- **Renze & Guven (2024)**, *Self-Reflection in LLM Agents* — structured self-reflection improves problem-solving accuracy with p < 0.001; applied here as session-level meta-cognition.
- **Dhuliawala et al. (Meta FAIR, ACL 2024)**, *Chain-of-Verification* — post-hoc verification chains reduce errors; reflection extends this to session-long pattern detection.
- **Li et al. (BIGAI / Peking University, ACL 2025)**, *ReflectEvo* — iterative reflection learning improved Llama-3-8B from 52.4% to 71.2% accuracy; institutional memory is the macro-scale equivalent.

## Process

1. **Full-conversation scan** — Re-read from turn 1. Identify mistakes (agent was wrong, hallucinated, suboptimal), friction (user had to correct/clarify/repeat), wins (non-obvious correct choice, user satisfaction), surprises (violated expectations).
2. **Cite specific exchanges** — Every finding references specific turn or exchange. Not "user seemed confused" but "Turn 7: user corrected JWT-in-cookies suggestion."
3. **Root-cause friction** — Why did friction happen? Skill ambiguity? Skipped verification? Underspecified request (should `/grill-me` have run)? Hallucinated file structure?
4. **Token efficiency audit** — Waste: turns spent on back-and-forth. Efficiency: single-prompt → correct result. Skill effectiveness: which helped? Which should have been used? Context pressure: when did window fill? Could session have been split earlier?
5. **Ranked improvements** — Numbered by impact × frequency: (1) High/high, (2) High/low, (3) Low/high.
6. **Pattern detection** — Check `docs/reflections/` for recurring patterns. "3rd time correcting agent on Server Actions as public endpoints."
7. **Save reflection** — `docs/reflections/REFLECTION_YYYYMMDD_HHMM.md`.
8. **Present to user** — "Session reflection complete. Key finding: [top lesson]. Full doc: `docs/reflections/...`. Please review ranked improvements — your input on priority affects future sessions."

## Operating Rules

- Do not rely on memory — re-read the full conversation.
- Every finding must cite a specific turn or exchange.
- Do not defend prior messages; treat every statement as a hypothesis.
- Separate "cannot verify" from "verified safe" — never imply proof not obtained.
- If this session resembles a previous reflection, cite it explicitly.

## Output Format

Save to `docs/reflections/REFLECTION_YYYYMMDD_HHMM.md`:
```markdown
# Session Reflection: [Brief topic]
## Metadata
- Date: YYYY-MM-DD
- Session length: N turns
- Skills used: [list]
- Context window peak: N%

## Mistakes
1. [Turn X] [Description] → [Lesson]

## Friction Points
1. [Turn X] [Description] → [Root cause] → [Fix]

## Wins
1. [Turn X] [Description] → [Why it worked]

## Token Audit
- Estimated waste: N tokens (X%)
- Most efficient turn: Turn X (N tokens, complete feature)
- Least efficient turn: Turn X (N tokens, 3 corrections needed)

## Ranked Improvements
1. [Actionable change]
2. [Actionable change]

## Patterns
- [Recurring observation or new pattern]

## Next Session Notes
- [What the next agent/human needs to know]
```

## Example

### Mistakes
- Turn 12: Suggested `useEffect` for auth check without cleanup → memory leak. Lesson: always include cleanup function with side-effect hooks.

### Friction Points
- Turn 7–9: User corrected 3 times on API contract shape. Root cause: agent assumed flat response; actual API returns nested `{data: {users: [...]}}`. Fix: run `/api-contract-validate` before suggesting fetch logic.
