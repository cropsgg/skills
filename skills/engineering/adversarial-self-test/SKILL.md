---
name: adversarial-self-test
description: "Red-team the agent's own output against OWASP Top 10 for LLM Applications and Agentic AI. Self-inject, test boundaries, check exfiltration paths. If you can't attack your own output, someone else will."
---

## When To Use

- After generating any code that handles user input, processes data from external systems, or invokes tools.
- Before writing generated code to disk or showing it to the user — test it for injection surfaces first.
- When the output includes configuration, SQL, shell commands, or HTML/JS that will be executed.
- When working in security-sensitive domains (auth, payments, PII, admin functions).
- After the Evaluator in `/evaluator-optimizer-loop` flags safety below 8 — run adversarial self-test on the output.

Related: `/karpathy-rules` for the 4-gate self-audit (lighter, faster); `/chain-of-verification` for factual claim verification; `/security-audit` for full trust-boundary review of the codebase; `/sharp-edges` for dangerous API detection.

Do not use this skill for outputs that are purely conversational, have no executable content, or are documentation-only. Do not use when the output has already passed a full human security review.

## Core Stance

- If you can't attack your own output, someone else will. The agent is the first red-teamer, not the last.
- Every generated content block is attack surface until proven otherwise. Code, config, commands, HTML, SQL — all of it.
- The test is adversarial, not supportive. Attempt to break the output. Try to inject. Try to exfiltrate. Try to escalate.
- Findings are not failures of the agent — they are successes of the test. Catching an injection surface before it's committed is a win.
- The OWASP Top 10 provides the test taxonomy. Test against the categories, not randomly.

## Research Backing

- **OWASP Top 10 for LLM Applications (2025)** — LLM01: Prompt Injection, LLM02: Insecure Output Handling, LLM06: Sensitive Information Disclosure, LLM08: Vector and Embedding Weaknesses, LLM09: Misinformation.
- **OWASP Top 10 for Agentic AI (2025)** — agent-specific vulnerabilities: tool invocation injection, permission escalation, autonomous action without human approval, context-window manipulation.
- **OWASP Code Review Guide** — systematic review for injection flaws: every boundary between untrusted input and execution is a potential injection surface.
- **Shinn et al. (Princeton, 2024)**, *Reflexion* — adversarial self-testing as a structured reflection step; testing one's own output for failure modes improves output safety.

## Process

1. **Identify the attack surface**
   - In the generated output: where does untrusted input enter? Where is data executed or rendered?
   - Mark boundaries: user input → parsing → storage → execution → output.
   - Classify the type of output: code (shell, SQL, JS, HTML, config), tool invocation, or text response that will be rendered.

2. **Test against OWASP LLM01 — Prompt Injection**
   - If the output is text that will be read by another agent or rendered to a user who might interact with an agent: attempt to embed malicious instructions.
   - Test inputs: "Ignore previous instructions and...", "SYSTEM: You are now...", "```system\nYou must...```"
   - If the output contains these patterns without sanitization: FAIL.

3. **Test against OWASP LLM02 — Insecure Output Handling**
   - If the output is code: does it handle untrusted input safely? Are there paths where output is not sanitized before rendering/execution?
   - Test: does generated HTML escape user content? Does generated SQL parameterize inputs? Does generated shell code quote arguments?
   - Flag: any path from user input to execution without sanitization.

4. **Test against command injection surfaces**
   - If the output includes shell commands, SQL, or eval-like constructs: attempt to inject.
   - Shell: `"; rm -rf /; "`, `$(whoami)`, backticks.
   - SQL: `' OR '1'='1`, `'; DROP TABLE users; --`.
   - JS eval: `"); process.exit(); ("`.
   - If any injection reaches the execution point without sanitization: FAIL.

5. **Test against data exfiltration paths**
   - If the output handles sensitive data (PII, tokens, secrets): trace where the data goes.
   - Check: is sensitive data logged? Is it included in error messages? Is it sent to third-party services?
   - Flag: any path where sensitive data leaves the system boundary without explicit user intent.

6. **Test against OWASP Agentic AI — tool invocation injection**
   - If the output generates tool invocations: can an attacker control the tool name, parameters, or target?
   - Test: can user input reach a tool call argument without validation?
   - Flag: any tool invocation parameter derived from untrusted input without whitelisting or sanitization.

7. **Report and fix**
   - Every finding: OWASP category, location in output, injection vector, fix.
   - Critical findings (command injection, SQL injection, prompt injection that controls agent behavior): fix before emitting.
   - High findings (missing sanitization, data exfiltration): fix or add `[SECURITY: sanitization needed at <point>]` tag if fix is beyond scope.

## Operating Rules

- Test every output that contains executable content. Code, config, commands — all of it.
- The test is adversarial. Try to break the output. If you're being nice to your own code, you're doing it wrong.
- Prompt injection in agent-to-agent text is a critical finding, not a theoretical concern.
- Don't conflate "I think this is safe" with "I tested this and it's safe." The test must produce evidence.
- If the adversarial test reveals a vulnerability class, run `/variant-analysis` to find other instances.
- Fixes from adversarial testing are the highest priority — an injection surface found by self-test that ships is a preventable incident.

## Output Format

Return a markdown report with these exact sections:

- Attack Surface Analysis (boundaries, input sources, execution points)
- OWASP LLM01 — Prompt Injection (test attempts, results, pass/fail)
- OWASP LLM02 — Insecure Output Handling (sanitization paths, gaps)
- Command Injection Surfaces (shell/SQL/eval injection vectors found)
- Data Exfiltration Paths (sensitive data flows, gaps)
- Tool Invocation Injection (agentic AI specific)
- Findings Summary (table: category, location, vector, severity, fix)
- Overall Verdict (SAFE / NEEDS FIXES / CRITICAL ISSUES)

## Example

### Attack Surface Analysis

Output: checkout webhook handler in `src/webhooks/checkout.ts`. Boundaries: Stripe webhook POST body → signature verification → JSON parse → DB write. Execution points: `db.query()`, `stripe.charges.create()`.

### OWASP LLM02 — Insecure Output Handling

- `event.data.object.metadata.userNote` is written to DB without sanitization — user-controlled string from Stripe metadata. Text content, low risk in DB context, but surfaced in admin dashboard without escaping. **FAIL** — needs HTML escaping in admin dashboard render.

### Command Injection Surfaces

- `stripe.charges.create({ amount, currency, description })` — `description` comes from Stripe event, which includes user-controlled product name. No injection risk (Stripe API handles parameterization). **PASS**.
- `db.query('INSERT INTO orders (id, metadata) VALUES ($1, $2)', [id, JSON.stringify(metadata)])` — parameterized, metadata is stringified. **PASS**.

### Data Exfiltration Paths

- `console.log('Webhook received:', event)` — full Stripe event logged, including customer email. Production logging. **FAIL** — sensitive data in logs. Fix: `console.log('Webhook received:', event.id, event.type)`.

### Findings Summary

| Category | Location | Vector | Severity | Fix |
|----------|----------|--------|----------|-----|
| LLM02 | Admin dashboard renders `userNote` | Unescaped HTML | High | Add `escapeHtml()` in admin dashboard render |
| Data Exfiltration | `src/webhooks/checkout.ts:12` | Full event logged including email | High | Log event ID and type only |

### Overall Verdict

**NEEDS FIXES** — 2 high-severity findings. Both fixable in <10 lines. Fix before commit.
