---
name: chain-of-verification
description: "Mandatory verification of every factual claim before emission. API contracts, dependency versions, file existence, behavior promises — claims about code are hypotheses until verified against the actual source. Based on Dhuliawala et al. (Meta FAIR, ACL 2024)."
---

## When To Use

- Before emitting any output that contains factual claims about the codebase.
- When explaining how a system works, what an API returns, or what a dependency does.
- After `/zoom-out` or any explanatory output — verify the explanation against source.
- When generating code that depends on specific library versions, API shapes, or file paths.
- When the user asks "are you sure?" — run the verification chain to confirm.

Related: `/karpathy-rules` Gate 4 for assumption verification in generated code; `/adversarial-self-test` for security-focused verification; `/tool-use-verification` for verifying tool call outputs; `/investigate` when a verification reveals a discrepancy that needs root cause analysis.

Do not use this skill for opinions, design recommendations, or trade-off discussions — verification applies to factual claims, not judgments. Do not use when the output is purely conversational with no technical claims.

## Core Stance

- Claims about code are hypotheses until verified against the actual source. The agent's memory is not a source of truth — the codebase is.
- "I think" and "probably" are red flags. If a claim can be verified, verify it. If it can't, mark it `[UNVERIFIED]`.
- Verification is fast — a `grep`, a `read_file`, or a `glob` call. If verification takes more than 30 seconds, the claim is too broad and should be decomposed.
- The verification chain is output-filtering: claims that fail verification are corrected or removed before emission. The user never sees unverified claims.
- Verification is not optional for security-critical claims (auth behavior, data handling, permission checks). Those must be verified or explicitly not made.

## Research Backing

- **Dhuliawala et al. (Meta FAIR, ACL 2024)**, *Chain-of-Verification Reduces Hallucination in Large Language Models* — verification chains reduce hallucination rate by 28% across multiple benchmarks; the "verify-then-answer" paradigm outperforms "answer-then-verify" and "answer without verification."
- **Renze & Guven (2024)**, *Self-Reflection in LLM Agents* — structured self-reflection improves problem-solving accuracy with p < 0.001; verification as a dedicated reflection step in the generation pipeline.
- **Li et al. (BIGAI / Peking University, ACL 2025)**, *ReflectEvo* — iterative reflection with verification improved Llama-3-8B accuracy from 52.4% to 71.2%; verification as a composable, repeatable step in agent workflows.

## Process

1. **Identify all factual claims** in the pending output
   - Scan the output before emitting it. Extract every claim that asserts a fact about the codebase.
   - Types of claims:
     - **Code behavior:** "this function returns X," "this endpoint requires auth," "this hook fires on mount."
     - **File/path claims:** "the config is at `src/config.ts`," "the type is defined in `types/index.ts`."
     - **Dependency claims:** "this uses `express@4.18`," "the Stripe SDK exposes `stripe.charges.create()`."
     - **API contract claims:** "the response shape is `{ data: { users: [...] } }`," "the error code is 401 for unauthenticated."
   - Flag claims that sound definitive but may be recalled from memory rather than verified.

2. **Draft a verification question for each claim**
   - Convert each claim into a falsifiable question: "Is it true that..."
   - Determine the cheapest verification method: `grep` for a pattern, `read_file` for a specific file, `glob` for a file path, shell command for behavior.

3. **Execute verification**
   - For each claim: run the verification command.
   - Record the result: CONFIRMED (source matches claim), CORRECTED (source differs — record the correct information), UNVERIFIABLE (cannot verify — source doesn't exist, tool unavailable).

4. **Correct or remove failed claims**
   - CONFIRMED: keep the claim as-is, add `[v]` marker.
   - CORRECTED: replace the claim with the verified correct information, add `[v]` marker.
   - UNVERIFIABLE: either remove the claim entirely or keep it with `[UNVERIFIED]` tag and a reason.
   - For security-critical claims: UNVERIFIABLE means remove. Do not emit an unverified claim about auth behavior.

5. **Emit the verified output**
   - The emitted output should contain only CONFIRMED (with `[v]`), CORRECTED (with `[v]` and the correct info), and appropriately tagged UNVERIFIED claims.
   - If >30% of claims were CORRECTED, flag the output as `[LOW CONFIDENCE — many corrections]`.
   - If any security-critical claim was CORRECTED, flag as `[SECURITY CLAIM CORRECTED — review required]`.

## Operating Rules

- Never skip verification with "I'm confident about this." Confidence is not verification.
- The verification step is fast — one grep, one read, one glob per claim. Don't over-verify (reading entire files for a config key).
- Security-critical claims (auth, permissions, data handling) that cannot be verified must be removed, not tagged `[UNVERIFIED]`.
- If verification would require reading >5 files or running a test suite, decompose the claim into smaller verifiable pieces.
- The `[v]` marker is output metadata — it tells the user this claim was verified. Don't explain the marker to the user unless asked.
- Verification is against the current codebase state, not git history or memory. Read the file, don't recall it.

## Output Format

Return a markdown report with these exact sections:

- Claims Identified (count, type breakdown)
- Verification Results (table: claim, method, result, correction if applicable)
- Verification Summary (confirmed / corrected / unverifiable counts)
- Verified Output (the final output with all corrections applied)
- Confidence Note (if applicable)

## Example

### Claims Identified

3 claims in pending output about the checkout API:
1. "The checkout endpoint is at `POST /api/checkout`"
2. "It returns `{ total, discount, items }`"
3. "Coupon codes are validated via `stripe.coupons.retrieve()`"

### Verification Results

| Claim | Method | Result | Correction |
|-------|--------|--------|------------|
| "Endpoint is POST /api/checkout" | `grep "checkout" src/routes/checkout.ts` | CONFIRMED | — |
| "Returns { total, discount, items }" | `read_file src/routes/checkout.ts` — L88 shows `res.json({ total, discount })` | CORRECTED | Returns `{ total, discount }` — no `items` field |
| "Coupon validated via Stripe" | `grep "stripe" packages/cart/src/discount.ts` — L12 shows `stripe.coupons.retrieve()` | CONFIRMED | — |

### Verification Summary

- Confirmed: 2
- Corrected: 1 (response shape missing `items`)
- Unverifiable: 0

### Verified Output

"The checkout endpoint is at `POST /api/checkout` [v]. It returns `{ total, discount }` [v] — note: `items` is not returned in the checkout response; it's a separate `GET /api/cart/items` call. [v] Coupon codes are validated via `stripe.coupons.retrieve()` [v]."

### Confidence Note

One correction (response shape). The `items` field exists in the cart response but not the checkout response — likely a common point of confusion. Document this distinction in the API docs.
