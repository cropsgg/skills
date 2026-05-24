---
name: land-and-deploy
description: "Merge PR after CI green, monitor deployment pipeline through to production, verify health via dashboards and error budgets. Extends /ship beyond PR creation into the full land-and-verify loop."
---

## When To Use

- After PR is approved and CI is green on the feature branch.
- User says "land this," "merge and deploy," or "ship to production."
- When confidence is needed that the change survived the merge queue and didn't regress in production.
- For changes touching shared infrastructure, data migrations, or auth — areas where branch CI alone is insufficient.
- After `/ship` created the PR and a human reviewer approved it.

Related: `/ship` creates the PR (run first if not yet created); `/canary` runs post-deploy monitoring checks at T+1/5/15min; `/rollback-plan` defines abort conditions before landing; `/observability-setup` must be in place for dashboard verification.

Do not use this skill before PR approval. Do not use if the repo has no deployment pipeline (use `/ship` only). Do not use for manual deploy processes without dashboard access — state the gap and fall back to `/ship`.

## Core Stance

- Branch CI is a necessary but insufficient signal. Merge skew, integration surprises, and real-user traffic reveal what pre-merge checks miss.
- Every deploy is a hypothesis: "this change does not degrade production." The hypothesis must be verified against live metrics, not assumed.
- Monitoring is not passive — the agent actively polls dashboards and error budgets at defined intervals post-merge and post-deploy.
- If health checks fail, the default response is rollback, not forward-fix. Forward-fix in production is only for trivial changes with zero blast radius.
- The audit trail matters: record merge commit, deploy timestamp, and all health check results for postmortem traceability.

## Research Backing

- **Beyer et al. (Google, 2016)**, *Site Reliability Engineering*, Chapters 8–9 — release engineering and progressive rollout: merge-queue discipline plus post-deploy verification are cornerstone SRE practices.
- **Forsgren et al. (2018)**, *Accelerate: The Science of Lean Software and DevOps* — elite performers practice continuous delivery with deployment monitoring; change failure rate is a key DORA metric.
- **Kim et al. (2016)**, *The DevOps Handbook* — the deployment pipeline extends through production telemetry validation, not just CI green; "done means deployed and healthy."
- **Honeycomb (2020)**, *Observability-Driven Development* — shipping is the midpoint, not the endpoint; production observability closes the deploy loop.

## Process

1. **Pre-land checklist**
   - Confirm PR is approved: `gh pr view <PR-number> --json state,reviewDecision` — state must be `OPEN` and reviewDecision `APPROVED`.
   - Confirm branch CI is green: `gh pr checks <PR-number>` — all required checks passed.
   - Confirm `/rollback-plan` has been run. If not, document why in ≤2 sentences (e.g., "trivial config change, revert is single commit").
   - Confirm no merge conflicts: `gh pr view <PR-number> --json mergeable` — must be `MERGEABLE`.

2. **Merge**
   - Detect merge strategy from repo history: `git log --merges -1 --format="%s"` on base branch. Look for "Merge pull request" (merge commit), squash pattern, or rebase pattern.
   - Merge: `gh pr merge <PR-number> --merge` (or `--squash` / `--rebase` per detected strategy).
   - If merge queue is configured (check `.github/workflows/` for `merge_group` trigger), use `gh pr merge <PR-number> --merge` and let the queue handle it.
   - Record merge commit hash from command output.

3. **Monitor CI on base branch**
   - Poll CI: `gh run list --branch main --limit 1 --json status,conclusion,url`.
   - Wait for completion with 15-minute timeout. Poll every 30 seconds: `gh run watch <run-id>` or loop `gh run view <run-id> --json status`.
   - If CI fails:
     - If failure is clearly related to this change (same test suite, same integration): `git revert <merge-commit>` and push. Open a revert PR: `gh pr create --title "Revert #<num>" --body "CI failure on main after merge. See run <url>."`.
     - If failure is clearly unrelated (flake, known transient with existing issue): note it, link to the flake issue, and proceed only with explicit user approval.

4. **Monitor deployment pipeline**
   - Detect deploy system from repo config: check `.github/workflows/` for deploy/CD workflows, `vercel.json`, `fly.toml`, `Procfile`, `app.json`, ArgoCD annotations.
   - Track deployment: wait for CD workflow to complete. For GitHub Environments: `gh api /repos/:owner/:repo/deployments`. For platform-specific: use available CLI.
   - Confirm deployment reached production (not staging). Record deploy timestamp.

5. **Verify production health**
   - Check error budget / SLO dashboard for the affected service. If dashboard exists: query recent error rate vs SLO window.
   - At minimum, for any deployment: check 5xx rate in last 5 minutes vs pre-deploy baseline.
   - Check p99 latency in last 5 minutes vs baseline.
   - Check crash/restart rate if applicable.
   - If any metric exceeds threshold (>2× baseline 5xx, >20% p99 drift, non-zero crash rate): trigger `/rollback-plan` immediately.

6. **Hand off to canary monitoring**
   - If `/canary` skill exists: invoke it for T+1, T+5, T+15 monitoring.
   - If not, run lightweight inline checks at T+1 and T+5 and document results.
   - Record the end time of the monitoring window.

7. **Report** with merge details, deploy confirmation, health results, and monitoring window status.

## Operating Rules

- Never merge without green CI. If CI is red, stop and report — do not bypass.
- Never skip the health verification step. "Deployed" is not "done."
- If the repo has no observable production telemetry, state explicitly: `[RISK: No production telemetry — deploy verified by pipeline status only]`.
- Revert, don't forward-fix, for production regressions unless the fix is a one-line config toggle with proven zero blast radius and user approval.
- Record merge commit, deploy timestamp, and all health check results. This is the audit trail for incident postmortems.
- Do not merge a PR you didn't create unless the user explicitly requests it with the PR number.
- If the deployment takes longer than 15 minutes, escalate to the user with status rather than polling indefinitely.

## Output Format

Return a markdown report with these exact sections:

- PR Merged (number, merge commit, merge method)
- Base Branch CI (status, run URL, duration)
- Deployment Pipeline (platform, stages, production deploy timestamp)
- Production Health Check (metrics before/after, thresholds, pass/fail)
- Post-Deploy Monitoring (T+1/5/15 results or handoff to /canary)
- Abort Conditions Met? (yes/no, rollback link if triggered)
- Recommended Next Step

## Example

### PR Merged

- PR #142 — `feat: add idempotency key to checkout webhook`
- Merge commit: `a1b2c3d`
- Method: `--squash`

### Production Health Check

| Metric | Pre-deploy | Post-deploy | Threshold | Status |
|--------|------------|-------------|-----------|--------|
| 5xx rate (5min) | 0.02% | 0.03% | >0.05% | PASS |
| p99 latency | 340ms | 355ms | >408ms (+20%) | PASS |
| Crash rate | 0 | 0 | >0 | PASS |
| Error budget | 99.7% | 99.6% | <99.5% (SLO) | PASS |

### Post-Deploy Monitoring

T+1min: 0 new console errors, crash rate unchanged. T+5min: Error budget stable at 99.6%. Monitoring window closes at 14:42 UTC. Handed off to `/canary` for T+15 check.

### Recommended Next Step

`/canary` will close the monitoring window at T+15. All checks clean so far.
