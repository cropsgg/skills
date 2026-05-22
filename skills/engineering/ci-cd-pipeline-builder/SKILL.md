---
name: ci-cd-pipeline-builder
description: >-
  Analyze a repository's tech stack and generate production-ready CI/CD pipeline
  configurations (GitHub Actions, GitLab CI, or Azure DevOps). Includes build,
  test, security scan, dependency audit, and deployment stages. Enforces
  pipeline-as-code best practices: DRY, matrix testing, artifact management,
  and secrets governance.
---

## When To Use

- Repository lacks CI configuration.
- Existing pipeline is >200 lines with commented-out jobs from prior attempts.
- Pipeline lacks security scanning, dependency auditing, or deployment gates.
- Team is migrating between CI providers.
- User says "set up CI" or "fix the build."

Related: `/ship` for individual PR workflow; `/dependency-audit` for standalone vulnerability scanning; `/rollback-plan` for deployment rollback strategy.

Do not use this skill for local-only scripts or projects that have no deployment target. Skip if the team uses a CI service not supported (GitHub Actions, GitLab CI, Azure DevOps).

## Core Stance

- CI/CD pipelines are the production gate for every code change, yet they're often copy-pasted from blog posts, bloated, and missing critical safety stages.
- A bad pipeline doesn't just slow development — it ships broken code, leaks secrets, and creates irreversible production states.
- Every pipeline must be stack-aware, minimal, correct, secure — never a generic template.

## Research Backing

- **Forsgren et al. (2018)**, *Accelerate* — continuous delivery practices (comprehensive CI/CD, trunk-based development, automated testing) are the strongest predictors of elite DevOps performance.
- **Humble & Farley (2010)**, *Continuous Delivery* — pipeline-as-code, fast feedback, and repeatable deployments are foundational CD principles.
- **OWASP (2024)**, *CI/CD Security Cheat Sheet* — dependency scanning, secret detection, and artifact integrity verification are mandatory CI stages for supply chain security.

## Process

1. **Detect stack** — Read `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Gemfile`, `pom.xml`, `Dockerfile`. Detect test runner, linter, type checker, package manager, deployment target.
2. **Generate pipeline stages** — In order: Checkout (shallow clone) → Setup (language matrix, dependency caching) → Lint & Format (fail, don't auto-fix) → Type Check → Unit Tests (parallel, coverage threshold 70%) → Integration Tests → Security Scan (dependency audit, secret detection, static analysis) → Build (production) → Artifact (tag with SHA) → Deploy Gate (manual approval for prod) → Deploy → Notify (failure only).
3. **Apply DRY** — YAML anchors or reusable workflows. Matrix for OS and language versions. Versions defined in one place.
4. **Secrets governance** — All secrets as `${{ secrets.XXX }}` or `${{ vars.XXX }}`. Generate `SECRETS_CHECKLIST.md`. Add validation job for missing secrets.
5. **Conditional execution** — Skip deploy on PRs from forks. Skip integration tests on `[skip ci]` commits. Run security scans on every push. Full matrix on `main`, reduced on feature branches.
6. **Artifact hygiene** — Upload only build output, test reports, coverage HTML. Retention: 3 days for branches, 30 days for `main`. Never upload `.env`, `node_modules`, raw DB dumps.
7. **Rollback reference** — Every deploy job includes rollback comment and reference to `docs/ROLLBACK.md`.
8. **Self-test** — Validate YAML syntax. Run `act -j lint` for GitHub Actions if `act` installed.

## Operating Rules

- Do not emit a generic template — every pipeline is contextual.
- Do not auto-fix lint/format in CI (belongs in pre-commit hooks).
- Do not hardcode secrets or API tokens.
- Skip integration tests if no `docker-compose.test.yml` or test DB config exists.
- Auto-deploy to staging; require manual approval for production.

## Output Format

Generate:
- `.github/workflows/ci.yml` (or `.gitlab-ci.yml`, `azure-pipelines.yml`)
- `docs/CI_SETUP.md` — How to add secrets, read logs, retry failed jobs
- `docs/SECRETS_CHECKLIST.md` — Required secrets and how to obtain them

## Example (Node.js + GitHub Actions + Vercel)

```yaml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-type-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --coverage --coverageThreshold=70
      - run: npm audit --audit-level=moderate
  build:
    needs: lint-type-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build-${{ github.sha }}
          path: dist/
          retention-days: 3
  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build-${{ github.sha }}
          path: dist/
      - run: npx vercel --token ${{ secrets.VERCEL_TOKEN }} --confirm
```
