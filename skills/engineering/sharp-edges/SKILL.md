---
name: sharp-edges
description: "Flag error-prone APIs and dangerous configurations: eval(), exec(), unsafe string interpolation in SQL/Shell, missing fetch timeouts, process.exit() in library code, prototype pollution. Sharp edges aren't bugs until someone bleeds — flag them first."
---

## When To Use

- During code review when scanning for dangerous patterns in the diff.
- Before merging a PR that introduces new external calls, shell operations, or dynamic code execution.
- When auditing a codebase for the first time — surface the most dangerous patterns immediately.
- After an incident where a dangerous API was the root cause — find all other instances.
- As a pre-commit or pre-push check on sensitive paths (auth, payment, data processing).

Related: `/insecure-defaults` for configuration-level danger; `/variant-analysis` to find all instances of a sharp edge once one is found; `/static-analysis` to automate sharp-edge detection with Semgrep rules; `/security-audit` for trust-boundary review.

Do not use this skill for configuration review (use `/insecure-defaults`), for dependency vulnerability scanning (use `/dependency-audit`), or for performance profiling (use `/performance-optimization`).

## Core Stance

- Sharp edges are not bugs until someone bleeds. The skill exists to flag them before the bleeding starts.
- Every dangerous function call must be either justified in a comment ("why this is safe") or replaced with a safe alternative.
- The pattern matters more than the instance. One `eval()` in test code is a review note. Three `eval()` across the codebase is a systemic problem.
- External calls without timeouts are time bombs. Every `fetch()`, `axios.get()`, `db.query()`, and `redis.get()` must have a timeout or be flagged.
- Library code and application code have different safety standards. `process.exit()` in a library is a bug; in a CLI is acceptable.

## Research Backing

- **OWASP Code Review Guide** — systematic review categories: injection flaws, unsafe function calls, missing error handling, and dangerous API usage as primary code-level security concerns.
- **CWE-95: Eval Injection** — `eval()` and equivalent dynamic code execution functions that accept untrusted input; CWE-78: OS Command Injection; CWE-89: SQL Injection — the canonical dangerous API categories.
- **Node.js Security Best Practices** — process-level safety: avoid `child_process.exec()` with string concatenation, avoid `eval()` and `new Function()`, set timeouts on all external calls, avoid `process.exit()` in libraries.
- **Trail of Bits**, *Sharp Edges Methodology* — systematic hunting for error-prone APIs: dynamic code execution, shell command construction, unsafe deserialization, and missing resource cleanup.

## Process

1. **Scan for dangerous function calls**
   - JavaScript/TypeScript: `grep -rn "eval(\|exec(\|new Function(\|child_process\.exec\|child_process\.spawn" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" src/`.
   - Python: `grep -rn "eval(\|exec(\|os\.system\|subprocess\.call\|subprocess\.Popen(\|pickle\.loads" --include="*.py" .`.
   - For each hit: read context. Is the input sanitized? Is it justified in a comment? Mark as DANGEROUS-JUSTIFIED or DANGEROUS-UNJUSTIFIED.

2. **Check external call safety**
   - Search for network/IO calls without timeouts: `grep -rn "fetch(\|axios\.\|\.get(\|\.post(\|db\.query\|redis\.\|\.send(" --include="*.ts" --include="*.js" .`.
   - For each hit: is there a timeout, AbortSignal, or Promise.race wrapper? If not, flag it.
   - Common patterns to flag: `fetch(url)` without `{ signal: AbortSignal.timeout(N) }`, `axios.get(url)` without `{ timeout: N }`.
   - Also check for unhandled promise rejections near these calls.

3. **Library code audit**
   - Identify library vs application code: `grep -rn "export \|module\.exports" --include="*.ts" --include="*.js" src/` — these are library surfaces.
   - In library code, flag: `process.exit()`, uncaught exceptions, global state mutation, monkey-patching built-ins.
   - In application code: these may be acceptable. Flag only if dangerous.

4. **Prototype pollution scan**
   - JavaScript: `grep -rn "__proto__\|\.prototype\[\|constructor\[\|Object\.assign" --include="*.ts" --include="*.js" src/`.
   - Flag: any deep merge or extend utility that doesn't sanitize `__proto__` and `constructor` keys.
   - Flag: `Object.assign` on user-controlled input without filtering.

5. **SQL and shell injection scan**
   - Search for string concatenation in SQL: `grep -rn "\+.*query\|\.query.*\+ \|query(.*\$\{" --include="*.ts" --include="*.js" .`.
   - Search for string concatenation in shell: `grep -rn "exec.*\$\{ \|exec.*\+ \|spawn.*\$\{ \|spawn.*\+ " --include="*.ts" --include="*.js" .`.
   - Flag: any dynamic SQL or shell command built via concatenation or template literals without parameterization.

6. **Report and prioritize**
   - Every finding: severity (critical / high / medium), location (file:line), the dangerous pattern, the safe alternative, and whether it's justified.
   - Critical: eval with user input, SQL injection, shell injection. High: missing timeout on payment/mutation calls, prototype pollution in shared utilities. Medium: missing timeout on read-only calls, process.exit() in library code.

## Operating Rules

- Never flag a dangerous API without providing the safe alternative. "Don't use eval" is not a finding — "Use `JSON.parse` instead of `eval` for parsing" is.
- A pattern in test code is still a finding — it normalizes the dangerous pattern for the team.
- "We'll never pass user input to this" is not a justification. Code changes. The sharp edge remains.
- If a dangerous call is necessary (e.g., `child_process.spawn` for a legitimate CLI tool), it must be wrapped in a dedicated utility with input validation and a comment explaining why it's safe.
- Do not flag `eval()` in bundler configuration files (webpack, vite) or build scripts — those run at build time, not runtime.

## Output Format

Return a markdown report with these exact sections:

- Dangerous Function Calls (table: file:line, function, input source, justification, severity)
- External Calls Without Timeouts (table: file:line, call, missing safeguard, severity)
- Library Code Issues (file:line, issue, severity)
- Prototype Pollution Surfaces
- SQL/Shell Injection Patterns
- Findings Summary (ranked by severity)
- Recommended Fix Order

## Example

### Dangerous Function Calls

| File:Line | Function | Input | Justification | Severity |
|-----------|----------|-------|---------------|----------|
| `src/templates/render.ts:34` | `new Function("data", "return \`" + template + "\`")` | User template string | None — arbitrary code execution | Critical |
| `src/cli/run.ts:12` | `child_process.exec(cmd)` | User command via CLI | Justified — CLI tool; documented in --help | Medium |

### External Calls Without Timeouts

| File:Line | Call | Missing | Severity |
|-----------|------|---------|----------|
| `src/payments/stripe.ts:45` | `stripe.charges.create({...})` | No timeout — charge could hang indefinitely | High |
| `src/api/users.ts:23` | `fetch(\`https://api.github.com/users/${username}\`)` | No AbortSignal — 3rd party call with no timeout | High |
| `src/lib/cache.ts:18` | `redis.get(key)` | No timeout — read-only cache call, low impact | Medium |

### Prototype Pollution Surfaces

- `src/utils/deep-merge.ts:12` — `Object.assign(target, source)` on user-supplied `source` object without filtering `__proto__`. Fix: add `if (key === "__proto__" || key === "constructor") continue;` before assign.

### Recommended Fix Order

1. Replace `new Function()` with a sandboxed template engine (Critical)
2. Add timeout to Stripe charge call (High)
3. Add AbortSignal to GitHub API fetch (High)
4. Filter `__proto__` in deep-merge utility (High)
5. Add timeout to Redis cache calls (Medium)
