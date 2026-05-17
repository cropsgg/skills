---
name: dependency-audit
description: "Assess dependency upgrades, transitive risk, and vulnerability posture using standard audit tooling."
---

## When To Use

- After bumping package versions in `package.json`, `pnpm-lock.yaml`, `yarn.lock`, `requirements.txt`, `poetry.lock`, `Cargo.toml`, `go.mod`, etc.
- When CI reports new vulnerabilities or license policy violations.
- When adding a new dependency “just for a helper” without reviewing transitive weight.
- During incident response when supply chain compromise or malicious package substitution is suspected.
- Before a release freeze, to ensure no unreviewed major upgrades slipped in via auto-merges.

Related: `/security-audit` for exploitability analysis, unsafe defaults, and runtime trust boundaries beyond CVE metadata.

Do not use this skill for replacing a formal security assessment of vendor contracts; it focuses on dependency graphs and known-vuln signals.

## Core Stance

- Treat semver bumps as behavior changes until proven by tests and release notes.
- Assume transitive dependencies matter: your graph is larger than `dependencies`, not smaller.
- Prefer minimal, well-maintained libraries with clear ownership over “kitchen sink” utilities.
- Demand reproducible lockfiles and pinned CI environments; “works on my machine” is a supply-chain risk.

## Research Backing

- **Snyk vulnerability database integration patterns** — common industry practice of mapping dependency versions to disclosed vulnerabilities and remediation guidance.
- **`npm audit` / `pip-audit` / `cargo audit` community tooling** — standard CLI workflows for surfacing known vulnerabilities in ecosystem lockfiles and manifests.

## Process

1. **Capture the dependency delta**
   - Use `git diff` on manifests and lockfiles; list direct upgrades and newly introduced packages.
2. **Run ecosystem audits**
   - JavaScript: `npm audit`, `pnpm audit`, or `yarn npm audit` (repo-dependent).
   - Python: `pip-audit` against pinned requirements; Poetry/pip-tools equivalents as applicable.
   - Rust: `cargo audit`.
   - Record outputs; separate severity vs exploitability vs reachability when tools confuse them.
3. **Review trust signals**
   - Maintainer continuity, release cadence, issue responsiveness, presence of security policy.
   - For GitHub-sourced packages: commit signing tags, release artifacts, sudden maintainer changes.
4. **Analyze transitive impact**
   - Identify duplicated libraries, version forks, and diamond conflicts that increase bundle size or binary risk.
5. **Map vulnerabilities-to-production**
   - Ask: is the vulnerable code path imported, executed, and reachable from production entrypoints?
6. **Define remediation**
   - Upgrade, patch, isolate, vendor fork (last resort), or compensating controls—each with an owner and timeline.

## Operating Rules

- Be precise, technical, and critical.
- Do not skip complex areas because they are hard to verify; say “reachability unknown” explicitly.
- Prefer evidence from code paths and validation output over intuition.
- Never dismiss a CVE solely because “we don’t think it applies”; document why not with import/reachability reasoning.
- Do not recommend `--force` installs as a policy; treat as incident-only with sign-off.
- If lockfile updates are huge, split work: security-critical path first, cosmetic churn second.

## Output Format

Return a markdown report with these exact sections:

- Summary (what changed, why)
- Direct Dependency Deltas
- Transitive Notables (duplication, risk concentration)
- Audit Tool Output (commands + key excerpts)
- Vulnerability Review (candidate list with severity + reachability notes)
- License / Policy Notes (if applicable)
- Upgrade Path (ranked options)
- Verification Plan (tests, staging rollout, monitoring)

## Example

### Direct Dependency Deltas

- Upgraded `axios` **1.6.x → 1.7.x** for security patch; added `lodash-es` for one helper (evaluate replacing with local utility).

### Audit Tool Output

- `pnpm audit --prod` reports **1 high** (GHSA-xxxx) in transitive `semver` copy used only by dev tooling — **not** shipped.

### Upgrade Path

- Prefer patching `axios` only; remove `lodash-es` if tree-shaking cannot guarantee import minimization.

### Verification Plan

- Run `pnpm test` + `pnpm -C apps/web build`; smoke deploy to staging; watch error rate and outgoing HTTP timeouts for 24h.
