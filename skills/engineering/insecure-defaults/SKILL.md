---
name: insecure-defaults
description: "Detect fail-open security patterns: debug mode in production, permissive CORS, disabled CSRF, default admin credentials, verbose error messages, unauthenticated health endpoints. Configuration is code — review it with the same rigor."
---

## When To Use

- Before a production launch — scan configuration for anything that would fail-open under attack.
- After a security incident where a misconfiguration was the root cause — find other misconfigurations before they're exploited.
- When onboarding a new service or third-party dependency with unknown defaults.
- As part of a `/security-audit` pass when reviewing configuration hygiene.
- When the user asks "is this secure by default?" or "what happens if this config is missing?"

Related: `/security-audit` for full trust-boundary review; `/variant-analysis` to find other instances of an insecure default once one is found; `/sharp-edges` for dangerous API patterns; `/static-analysis` to run Semgrep rules that detect insecure defaults automatically.

Do not use this skill for code-level vulnerability hunting (use `/sharp-edges` or `/security-audit`), for dependency vulnerability scanning (use `/dependency-audit`), or when the system has no configurable security posture (then note the gap rather than scanning nothing).

## Core Stance

- A system is only as secure as its weakest default. Misconfigurations are not "configuration bugs" — they are security vulnerabilities at the infrastructure level.
- Configuration is code. It lives in files, env vars, and platform settings — and it must be reviewed with the same rigor as application code.
- The principle of least privilege applies to configuration: every flag, header, and setting should enable the minimum access necessary. Anything beyond that is a finding.
- Fail-open is the enemy. Every security control must default to deny, then explicitly allow. A missing config should mean "deny," not "allow."
- Configuration documentation must list the secure default. If the docs say "set this to true," but the default is false, that's a finding.

## Research Backing

- **OWASP Top 10 (2021)**, *A05: Security Misconfiguration* — misconfiguration is the fifth most critical web application security risk. Includes: missing security hardening, unnecessary features enabled, default accounts and passwords, error handling revealing stack traces.
- **CWE-16: Configuration** — the Common Weakness Enumeration category for configuration-level vulnerabilities: default credentials (CWE-1392), overly permissive CORS (CWE-942), verbose error messages (CWE-209), debug mode in production (CWE-489).
- **Trail of Bits**, *Insecure Defaults Methodology* — systematic approach to finding fail-open patterns: scan for debug flags, permissive cross-origin policies, disabled security features, and unauthenticated administrative endpoints.
- **NIST SP 800-128**, *Guide for Security-Focused Configuration Management* — configuration baselines, least functionality principle, and continuous configuration monitoring.

## Process

1. **Configuration audit pass**
   - Inventory all configuration files: `.env`, `.env.production`, `.env.local`, `config/*.yml`, `config/*.json`, `config/*.toml`, `app.config.*`, `next.config.*`, `vite.config.*`, `webpack.config.*`, `docker-compose.yml`, `docker-compose.prod.yml`, Kubernetes manifests, Terraform, Pulumi.
   - For each file: `grep -in "debug\|verbose\|development\|local\|secret\|password\|token\|key" <file>`.
   - Flag: debug/verbose flags set to `true` or `1` in production-bound configs.

2. **CORS and origin check**
   - Search for CORS configuration: `grep -rn "Access-Control-Allow-Origin\|cors\|CORS" --include="*.ts" --include="*.js" --include="*.yml" --include="*.json" .`
   - Flag: `Access-Control-Allow-Origin: *` — permissive CORS allows any origin to read responses.
   - Flag: `Access-Control-Allow-Credentials: true` combined with wildcard origin (breaks the spec, but some servers allow it).
   - Flag: CSRF protection disabled: `csrf: false`, `csrf: { enabled: false }`, missing `SameSite` cookie attribute.

3. **Error visibility check**
   - Search for error detail leakage: `grep -rn "stack\|trace\|debug\|verbose" --include="*.ts" --include="*.js" .` — focus on error response handlers.
   - Flag: stack traces included in 500 responses, detailed DB error messages surfaced to the client, `NODE_ENV=development` in production.
   - Check: do error responses leak internal paths, SQL queries, or dependency versions?

4. **Auth bypass surfaces**
   - Search for unauthenticated endpoints: `grep -rn "public\|noauth\|no-auth\|skip.*auth\|bypass" --include="*.ts" --include="*.js" .`
   - Flag: health endpoints that return internal state without authentication, admin endpoints without auth guards, debug routes (`/debug`, `/graphiql`, `/swagger`) exposed in production.
   - Check: default admin credentials: `admin:admin`, `root:root`, `admin:password` anywhere in config or docs.

5. **Default credential scan**
   - Search for hardcoded defaults: `grep -rn "default.*password\|default.*secret\|PASSWORD\|SECRET\|API_KEY" --include="*.ts" --include="*.js" --include="*.env*" --include="*.yml" .`
   - Flag: any credential that looks like a default (`changeme`, `password`, `secret`, `admin`) rather than a generated value.

6. **Report and prioritize**
   - Every finding: severity (critical / high / medium / low), location (file:line or config key), what the insecure default is, what the secure default should be, fix snippet.
   - Prioritize: critical first (exposed credentials, unauthenticated admin), then high, then medium.

## Operating Rules

- Never treat a config finding as "low priority" just because it hasn't been exploited yet. Insecure defaults are ticking time bombs.
- Always provide the secure alternative. "Disable this" without saying what to replace it with is not a finding.
- Environment-specific findings must be tagged with the environment they affect (dev / staging / production).
- If production and development share a config file, flag it as a finding — they should be separate.
- Never scan `.env` files for the report's findings and then include the actual secrets in the output. Report the key name only.
- A disabled security feature is a finding even if "we never use that feature." Attackers don't care what you use.

## Output Format

Return a markdown report with these exact sections:

- Config Inventory (files scanned, directories)
- Debug/Verbose Mode Findings
- CORS and Origin Findings
- Error Visibility Findings
- Auth Bypass Surfaces
- Default Credential Findings
- Findings Summary (table: severity, location, finding, fix)
- Recommended Fix Order

## Example

### Config Inventory

Scanned: `.env`, `.env.production`, `next.config.ts`, `src/middleware/cors.ts`, `docker-compose.yml`, `docker-compose.prod.yml`, `src/lib/errors.ts`

### CORS and Origin Findings

- **High** — `src/middleware/cors.ts:12` — `origin: "*"` allows any origin to make credentialed requests. Fix: `origin: process.env.ALLOWED_ORIGINS?.split(",") || ["https://example.com"]`.
- **High** — `docker-compose.prod.yml:28` — `CSRF_ENABLED=false`. Fix: `CSRF_ENABLED=true`.

### Error Visibility Findings

- **High** — `src/lib/errors.ts:22` — `NODE_ENV=production` check missing; stack traces included in all 500 responses. Fix: add `if (process.env.NODE_ENV === "production") return genericError;`.
- **Medium** — `docker-compose.yml:15` — `NODE_ENV=development` in base compose file, inherited by production override. Fix: move to dev override only.

### Auth Bypass Surfaces

- **Critical** — `src/routes/health.ts:5` — `/health/db` endpoint returns DB connection pool stats without authentication. Fix: require admin auth or move to a separate internal port.
- **Medium** — `next.config.ts:45` — `/graphiql` enabled unconditionally. Fix: `graphiql: process.env.NODE_ENV !== "production"`.

### Recommended Fix Order

1. Restrict `/health/db` (Critical — internal state exposure)
2. Enable CSRF in production (High)
3. Stack trace suppression (High)
4. Restrict CORS origin (High)
5. Disable GraphiQL in production (Medium)
