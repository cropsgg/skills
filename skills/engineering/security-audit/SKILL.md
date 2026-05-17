---
name: security-audit
description: "Review trust boundaries, auth, input handling, and insecure defaults in changed code."
---

## When To Use

- Before merging changes that parse untrusted input (HTTP, files, webhooks, CLI args, LLM tool outputs).
- When touching authentication, authorization, session handling, secrets, or crypto.
- When adding features that increase **agency** (automatic writes, destructive actions, elevated privileges).
- When integrating third-party SDKs, parsers, or template engines that can bridge data into code execution.
- When adjusting CORS, cookies, CSP, SSRF-prone fetch wrappers, or reverse-proxy headers.

Related: `/dependency-audit` for transitive CVE and upgrade-risk analysis.

Do not use this skill for an exhaustive org-wide pentest baseline; scope to the diff and its immediate blast radius unless asked.

## Core Stance

- Assume attackers control inputs you do not cryptographically authenticate.
- Treat “internal network” as a trust failure mode, not a security boundary by default.
- Demand evidence: either a failing safe test, a scanner result, or a cited vulnerable pattern in code.
- Do not confuse privacy with security; redact logs yet still validate authorization on every sensitive read.

## Research Backing

- **Trail of Bits Security Skills Suite** (community standard, **2,439+** stars) — patterns for **static analysis**, **insecure defaults**, **variant analysis**, and **differential security review**.
- **OWASP Top 10 for Agentic AI (2025)** — highlights **prompt injection**, **insecure output handling**, and **excessive agency** as critical AI security risks.

## Process

1. **Define the trust model**
   - Identify actors: anonymous user, authenticated user, admin, internal job runner, partner system.
   - Map data flows from untrusted input to persistence, outbound requests, and rendered output.
2. **Inventory sensitive surfaces**
   - Routes/handlers changed: list methods, paths, and auth middleware in `src/**/routes*`, `app/**`, `pages/api/**`, or `**/handler*.ts`.
   - Data stores touched: SQL, document DB, object storage, cache keys derived from user input.
3. **Static review for classic web flaws**
   - Injection: SQL/NoSQL/command/template; validate parameterization and builder discipline.
   - Access control: object-level authorization (IDOR), missing tenant scoping, role checks bypassed by alternate endpoints.
   - SSRF: user-controlled URLs/IPs, open redirects, webhook callbacks.
4. **Review defaults and deployment footguns**
   - Debug modes, permissive CORS, wildcard `Access-Control-Allow-Origin`, credential cookies without `Secure`/`HttpOnly` where applicable.
   - Dangerous file permissions, world-readable secret mounts, default admin passwords (in examples).
5. **Run tooling if available (repo-dependent)**
   - Examples: `semgrep`, `gitleaks`, `npm audit`, `pip-audit`, language linters with security rules.
   - Capture command + relevant excerpt; do not paste secrets.
6. **Summarize with mitigations**
   - Every finding must map to: prevent, detect, or contain—and name the owner (code vs infra).

## Operating Rules

- Be precise, technical, and critical.
- Do not skip complex areas because they are hard to verify; mark coverage gaps explicitly.
- Prefer evidence from code paths and validation output over intuition.
- Separate **vulnerability** from **hardening**; label severity honestly.
- Never recommend “security by obscurity” as the primary control.
- If the change touches LLM tool execution, treat tool arguments as untrusted and require explicit approval gates for destructive operations.

## Output Format

Return a markdown report with these exact sections:

- Executive Summary (3–6 bullets)
- Findings (Critical / High / Medium / Low)
- Trust Boundaries and Data Flows
- Authentication and Authorization Review
- Sensitive Data Handling (PII/secrets/logging)
- Dependency and Supply Chain Notes
- Recommendations with Verification Commands

Each finding must include: **location**, **attack scenario**, **impact**, **likelihood (qualitative)**, **fix**, **verification**.

## Example

### Findings — High

- **Location:** `api/src/users.ts` — `GET /users/:id`
- **Attack scenario:** Any authenticated user passes another user’s UUID.
- **Impact:** IDOR exposure of profile fields.
- **Fix:** enforce `req.user.id === :id` **or** explicit admin role; add tests for cross-user access.
- **Verification:** `pnpm test api -t usersAccessControl`

### Trust Boundaries and Data Flows

Browser → API gateway → service → DB; webhook path bypasses CSRF but must use signed secrets (verify HMAC in `webhooks/stripe.ts`).
