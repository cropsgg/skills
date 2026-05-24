---
name: static-analysis
description: "Orchestrate CodeQL, Semgrep, or ESLint security rules with decision logic: pick the right tool for the language, run it, parse SARIF output, and triage results by severity and confidence. Static analysis without triage is noise."
---

## When To Use

- Before merging a PR that touches security-sensitive code (auth, payments, data processing).
- When setting up CI for a new repository and security scanning is not yet configured.
- After a security incident — scan the codebase with the most aggressive ruleset available.
- When evaluating a new codebase for the first time — run all available static analysis tools.
- When the user asks "are there any vulnerabilities in this code?" and no scanner has run recently.

Related: `/variant-analysis` to find bug-class instances after static analysis identifies a pattern; `/security-audit` for trust-boundary review of static analysis findings; `/sharp-edges` for dangerous API detection; `/insecure-defaults` for config-level findings.

Do not use this skill when static analysis is already running in CI and the last scan is <24 hours old (just read the SARIF output). Do not use for performance analysis (use `/performance-optimization`). Do not use for dependency scanning (use `/dependency-audit`).

## Core Stance

- Static analysis without triage is noise. The skill's value is in filtering false positives and prioritizing real findings — not in running the tool.
- The right tool depends on the language. CodeQL excels at compiled languages (Java, C#, Go, C/C++) with deep data-flow analysis. Semgrep excels at interpreted languages (Python, JS, Ruby, PHP) with fast pattern matching. ESLint security rules catch JavaScript/TypeScript-specific issues.
- Every finding must be cited with file:line, the rule that triggered it, and a manual verification step. SARIF output alone is not enough.
- Severity from the tool is a starting point, not a verdict. A CodeQL "error" may be a false positive in context. A Semgrep "warning" may be a critical vulnerability with the right input.
- The deliverable is a triaged list of confirmed vulnerabilities and a recommendation for which tool and ruleset to add to CI.

## Research Backing

- **Sadowski et al. (Google, 2018)**, *Lessons from Building Static Analysis Tools at Google* — false positive rate is the primary adoption barrier; triage and suppression workflows determine whether static analysis results are acted on or ignored. Findings that aren't triaged don't get fixed.
- **CodeQL Documentation (GitHub)** — QL query language for variant analysis and deep data-flow reasoning; SARIF output for standardized result interchange; supports compiled languages with build extraction.
- **Semgrep Registry** — community ruleset for security, correctness, and best-practice patterns across 30+ languages; pattern-based matching with `pattern-not` for false-positive suppression.
- **OWASP Code Review Guide** — static analysis as a prerequisite for manual code review; tool-assisted review catches mechanical issues, freeing human review for architectural and design-level concerns.

## Process

1. **Detect the language and framework**
   - `ls package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`, `pom.xml`, `build.gradle`, `Gemfile`, `composer.json`.
   - For each language detected: note the build system, entry points, and test directories (to exclude from scan if desired).

2. **Select the right tool**
   - **Compiled languages (Java, C#, Go, C/C++, Swift, Kotlin):** CodeQL. Requires a buildable database. Run: `codeql database create <db> --language=<lang> --source-root=.` then `codeql database analyze <db> <query-pack> --format=sarif-latest --output=/tmp/codeql-results.sarif`.
   - **Interpreted languages (Python, JavaScript, Ruby, PHP):** Semgrep. Fast, no build step. Run: `semgrep --config=auto --sarif -o /tmp/semgrep-results.sarif`.
   - **JavaScript/TypeScript additional:** ESLint with `eslint-plugin-security` and `@typescript-eslint` rules.
   - If neither CodeQL nor Semgrep is available: fall back to ESLint security rules, bandit (Python), or brakeman (Ruby). Mark the scan `[LIMITED — <tool> only]`.

3. **Run the scan**
   - For each selected tool, run with the most comprehensive ruleset available.
   - CodeQL: use `security-and-quality` query suite (includes security, correctness, and maintainability).
   - Semgrep: use `--config=auto` or `--config "p/owasp-top-ten" --config "p/supply-chain"`.
   - ESLint: use `plugin:security/recommended` and any project-specific security rules.
   - Record: tool, version, ruleset, scan duration, result count.

4. **Parse SARIF output**
   - Read the SARIF file(s). For each result: extract rule ID, message, file:line, severity (error/warning/note).
   - Group by rule ID — patterns emerge. 50 instances of the same rule signal a systemic issue, not 50 separate bugs.

5. **Triage results**
   - For each result or group: read the code at the file:line. Does the tool's finding hold up?
   - Classification per result:
     - **CONFIRMED:** the finding is real and exploitable (or will cause a bug). Severity confirmed.
     - **CONTEXTUAL:** the finding is real in general but safe in this specific context (e.g., eval in a test file, SQL concat with a hardcoded string). Downgrade severity.
     - **FALSE POSITIVE:** the tool's pattern matched but the code is safe (e.g., parameterized query that Semgrep missed). Note why.
   - Priority: CONFIRMED + Error > CONFIRMED + Warning > CONTEXTUAL > FALSE POSITIVE.

6. **Report and recommend CI integration**
   - List all confirmed findings with fix suggestions.
   - Recommend which tool + ruleset to add to CI: "Add `semgrep --config=auto` as a CI step. It caught all 5 confirmed findings."
   - Note the false positive rate: "12 findings, 5 confirmed (42% true positive rate)."

## Operating Rules

- Never report raw SARIF output as findings. Every result must be manually verified.
- If a tool produces >50 results, stop triaging at 50 and report the systemic pattern instead.
- The tool's severity is a hint, not a verdict. Re-severity during triage.
- If none of the recommended tools are available, scan with whatever is (grep-based pattern matching) — but mark `[NO SAST — grep-only]`.
- Never run tools that require a license without confirming the project has one.
- If a finding is in auto-generated code, exclude it but note the exclusion.
- Test directories are not exempt — security bugs in test code normalize the pattern for the team.

## Output Format

Return a markdown report with these exact sections:

- Languages Detected
- Tools Used (tool, version, ruleset, result count)
- Raw Result Count (per tool, per severity)
- Confirmed Findings (table: file:line, rule, description, severity, fix)
- Contextual Findings (downgraded with reason)
- False Positives (with reason)
- Triage Summary (confirmed / contextual / false positive counts)
- Recommended CI Integration (tool, command, severity threshold)
- Recommended Fix Order

## Example

### Tools Used

| Tool | Version | Ruleset | Results |
|------|---------|---------|---------|
| Semgrep | 1.60.0 | `--config=auto` | 18 |
| ESLint | 9.0.0 | `plugin:security/recommended` | 4 |

### Confirmed Findings

| File:Line | Rule | Description | Severity | Fix |
|-----------|------|-------------|----------|-----|
| `src/auth/login.ts:45` | `javascript.express.security.audit.xss` | `req.body.redirect` used in `res.redirect()` without validation — open redirect | High | Validate against whitelist of allowed redirect URLs |
| `src/api/export.ts:78` | `python.flask.security.audit.render-template-string` | `render_template_string(user_template)` with user input — SSTI | Critical | Use `render_template` with a fixed template file |
| `src/db/queries.ts:112` | `java.security.audit.sqli` | `String.format("SELECT * FROM users WHERE id = %s", userId)` — SQL injection | Critical | Use PreparedStatement |

### Triage Summary

- Confirmed: 5 (2 Critical, 3 High)
- Contextual: 3 (downgraded — safe in context)
- False Positive: 14 (mostly `console.log` flagged by Semgrep as "information leakage")

### Recommended CI Integration

```yaml
# .github/workflows/sast.yml
- name: Semgrep
  run: semgrep --config=auto --error --severity=ERROR
```
Add `--severity=ERROR` initially to avoid CI noise from 14 false positives. Upgrade to WARNING after suppressing false positives in `.semgrepignore`.

### Recommended Fix Order

1. SSTI in export handler (Critical — remote code execution)
2. SQL injection in DB queries (Critical — data exfiltration)
3. Open redirect in login (High)
4. Remaining 2 High findings
