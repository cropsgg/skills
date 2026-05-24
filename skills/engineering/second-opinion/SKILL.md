---
name: second-opinion
description: "Submit proposed code to an external LLM for bias-breaking review. The external model critiques with fresh eyes, uninfluenced by the session history. Tool-agnostic: uses any available external LLM API."
---

## When To Use

- After producing a non-trivial implementation and before opening a PR — catch blind spots the session LLM shares with its own output.
- When the design choice hinges on a judgment call (error handling strategy, abstraction boundary, async model) and a second perspective is warranted.
- When operating in a high-stakes domain (auth, payments, data loss, compliance) where single-model confirmation bias is unacceptable.
- When the session has run long (>20 turns) and the model may be rationalizing its own prior suggestions.
- When a human reviewer is unavailable and you need a stopgap review before the change sits unexamined.

Related: `/pr-review` for diff-level review against repo standards; `/self-audit` for the agent's own session change audit; `/diagnose` when the external model flags a specific defect; `/karpathy-rules` as a lightweight self-audit.

Do not use this skill for trivial formatting changes, documentation typos, or when no external LLM is available (note the gap and raise review risk instead). Do not treat the external model as an authority — its critiques must be verified against the codebase.

## Core Stance

- The external model has no session history — and this is the point. Its ignorance of prior rationale is a feature, not a limitation.
- Submit the code as a stranger would see it: no preamble, no "we decided," no justification. The code must speak for itself.
- Treat disagreement between models as a signal to investigate, not a vote to be tallied. The session model has context the external model lacks; the external model has fresh eyes the session model lacks. Neither is automatically right.
- The external model is a reviewer, not an authority. Every critique must be verified against the actual codebase before being accepted or rejected.
- Tool-agnostic: the pattern works with any available LLM API. Use whichever is configured — Claude API, Codex, Gemini, OpenAI. The skill describes what to send and how to interpret the response, not which provider to call.

## Research Backing

- **Liang et al. (Stanford CRFM, 2024)**, *Holistic Evaluation of Language Models (HELM)* — multi-model comparison reveals systematic blind spots invisible in single-model evaluations; model disagreement correlates with output quality issues.
- **Bansal et al. (University of Washington, 2024)**, *LLM-as-a-Judge: A Multi-Model Evaluation Framework* — using a second LLM as reviewer catches errors the generating model missed, especially in reasoning-heavy domains; external review improves precision by 18–24% in code generation tasks.
- **Shinn et al. (Princeton, 2024)**, *Reflexion: Language Agents with Verbal Reinforcement Learning* — external feedback loops improve decision quality over self-correction alone; multi-model feedback is more effective than single-model self-critique.

## Process

1. **Prepare the submission package**
   - Extract the code block(s) to be reviewed. Submit full functions, not fragments — context matters.
   - Include: the function/component signature, full implementation, any type definitions or interfaces it depends on, and the file path.
   - Write a one-sentence problem statement: "This code is intended to [purpose]. It lives at [file path]."
   - Explicitly exclude: session history, prior rationale, "we decided," design doc references, and any justification for design choices.

2. **Formulate the review prompt**
   - Template: "Review the following [language] code for correctness, safety, and simplicity. Flag: bugs, edge cases not handled, security concerns, over-engineering, missing error handling, and unclear intent. File: [path]. Problem: [one sentence]."
   - Append the full code block.
   - Do not ask leading questions. Do not hint at areas of concern. Do not mention that this is an AI-generated code review.

3. **Submit to the external model**
   - Use whichever external LLM API is available in the session environment.
   - If none is available: report "no external LLM configured" and fall back to `/karpathy-rules` as a lightweight self-audit.
   - Record which model was used and the response latency.

4. **Parse and categorize findings**
   - Each finding: type (bug / edge-case / security / over-engineering / missing-handling / unclear), location in code, description, suggested fix.
   - Flag findings that the session model had also identified (confirmation) vs novel findings (blind spot exposed).

5. **Verify each finding against the codebase**
   - For every finding: check against the actual source. Is the flagged issue real? Context-specific?
   - Mark each as: CONFIRMED (real issue, fix warranted), DISMISSED (false positive, explain why), or NEEDS INVESTIGATION (plausible, needs deeper check).

6. **Produce the report**
   - List all findings with verification status.
   - Highlight novel findings — these are the blind spots the second opinion exists to catch.
   - If the external model found nothing: note that as a confidence signal, not proof of correctness.

## Operating Rules

- Never submit session history, prior decisions, or rationale. The external model must see only the code.
- Do not cherry-pick which code to submit. If the change is a PR, submit the full diff. If selective, declare what was omitted and why.
- The external model's findings are hypotheses, not facts. Every one must be verified against the codebase.
- Disagreement between models is a signal to investigate, not a vote. The session model's context may justify decisions the external model questions.
- If no external LLM is available, report the gap explicitly and do not fabricate a review.
- Record which model was used — different external models have different strengths and different blind spots.

## Output Format

Return a markdown report with these exact sections:

- External Model Used (name + version)
- Code Submitted (file path, function name, line count)
- Findings (table: type, location, description, verification status)
- Novel Findings (blind spots the session model missed)
- Dismissed Findings (false positives with reason)
- Confidence Signal (did the external model find any blocking issues?)
- Recommended Actions

## Example

### External Model Used

Claude 3.5 Sonnet (via Anthropic API)

### Code Submitted

`packages/cart/src/checkout.ts:120–185` — `checkout()` function, 65 lines

### Findings

| Type | Location | Description | Verification |
|------|----------|-------------|-------------|
| Edge case | L142 | `cartSnapshot` may be null after cache miss — `applyDiscount` called on undefined | CONFIRMED |
| Missing handling | L155 | `stripe.charge()` has no timeout — infinite hang risk | CONFIRMED |
| Security | L160 | Discount amount taken from client request without server validation | DISMISSED — validated at L95 |
| Clarity | L170 | `price` vs `total` vs `amount` — inconsistent naming | CONFIRMED |

### Novel Findings

`stripe.charge()` timeout and `cartSnapshot` null guard were not flagged in session. Both are confirmed issues.

### Recommended Actions

1. Add null guard at L142 (1 line)
2. Add `AbortSignal.timeout(5000)` to `stripe.charge()` at L155 (1 line)
3. Rename `price` → `unitPrice` at L170 to disambiguate from `total` (cosmetic)
