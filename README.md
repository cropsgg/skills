# AI Skills for Production Engineering

**These are Research backed agent skills that close the gap between prototype and production.**

This library complements widely used public skill collections (for example, Matt Pocock’s) by concentrating on lifecycle gaps that routinely separate demos from systems you can run under load, audit, and operate: **self-audit**, **security**, **performance**, **regression**, **accessibility**, and **operational resilience**. The skills are written so they can be composed: small, repeatable procedures with explicit evidence requirements rather than open-ended brainstorming.

Use this repository as a **human-curated, research-anchored** playbook. Each skill cites a narrow set of named sources; extend it only when you can attach equivalent evidence (see [CONTRIBUTING.md](CONTRIBUTING.md)).

If a skill produces a report, treat that report like a code review: every finding should be reproducible from a command, a file path, or a quoted snippet.

---

## The Research Behind These Skills

### Self-audit and validation skill

Modern agents benefit from structured reflection and verification loops that treat outputs as hypotheses until checked.

- **Renze & Guven (Johns Hopkins University, 2024)** — *Self-Reflection in LLM Agents: Effects on Problem-Solving Performance.* Self-reflection improved LLM accuracy with **p < 0.001** across **GPT-4**, **Llama 2 70B**, and **Gemini 1.5 Pro**.
- **Dhuliawala et al. (Meta FAIR, ACL 2024)** — *Chain-of-Verification Reduces Hallucination in Large Language Models.* **CoVe** reduced list-generation hallucinations from **2.95 to 0.68** entities and improved biography factuality (**FACTSCORE**) from **55.9 to 71.4**.
- **Zhang et al. (NTU / Skywork AI, 2025)** — *Incentivizing LLMs to Self-Verify Their Answers.* Models trained to self-verify achieved verification accuracy on par with **GPT-4o** and **Claude-3.7-Sonnet**.
- **Li et al. (BIGAI / Peking University, ACL 2025)** — *ReflectEvo: Improving Meta Introspection of Small LLMs by Reflection Learning.* Iterative reflection improved **Llama-3-8B** from **52.4% to 71.2%** and **Mistral-7B** from **44.4% to 71.1%**.
- **Ma et al. (2025)** — *S²R: Teaching LLMs to Self-verify and Self-correct via Reinforcement Learning.* **Qwen2.5-math-7B** improved from **51.0% to 81.6%** using iterative self-verification.

### Security audit

Security review for agent-generated code must assume unsafe defaults and implicit trust boundaries.

- **Trail of Bits Security Skills Suite** (community standard; **2,439+** stars) — covers **static analysis**, **insecure defaults**, **variant analysis**, and **differential security review**.
- **OWASP Top 10 for Agentic AI (2025)** — documents **prompt injection**, **insecure output handling**, and **excessive agency** as critical AI security risks.

### Performance optimization

Performance work needs measurable baselines; guessing “feels fast” fails under real traffic.

- **Vercel React Performance Rules** — a **57-rule** framework establishing measurable performance baselines for frontend work.
- **Community performance-checker skills** — widely adopted patterns for **profiling**, **bottleneck detection**, and **N+1 query** elimination.

### Regression check

Quality gates that iterate evaluation and correction improve reliability of automated changes.

- **Evaluator–Optimizer patterns (OpenAI / Anthropic)** — iterative quality-check loops improve output reliability.
- **Community regression-checker skills** — adopted for catching unintended side effects across test suites.

### Accessibility audit

Accessibility is a conformance and usability problem; automate what you can, then verify manually.

- **axe-core + jsx-a11y** community standards — automated **WCAG 2.1 AA** compliance checking.
- **W3C WAI-ARIA Authoring Practices** — authoritative reference for accessible component patterns.

### Database review

Schema and migration safety prevent slow-motion production incidents.

- **PlanetScale database skill patterns** — **schema safety**, **migration review**, and **query optimization**.
- **Academic and industry research** on **schema drift** and **data integrity** in automated code generation (treat as an explicit risk category during review—do not assume migrations are “probably fine”).

---

## Installation — 30 Seconds

This library ships a cross-host installer so skills are available any supported coding agent with one command after clone. Skills stay Markdown-on-disk (portable, reviewable). Compatibility note: these procedures were exercised across **GPT-4o**, **Claude 3.5/3.7 Sonnet**, and **o3-mini** during library validation—prompts are written to be model-agnostic.

For setup/source code, see [`bin/`](bin/), [`src/`](src/), and [`docs/HOST_REFERENCE.md`](docs/HOST_REFERENCE.md).

### Personal Install (Recommended)

```bash
git clone --single-branch --depth 1 https://github.com/cropsgg/skills.git ~/.ai-skills && cd ~/.ai-skills && ./setup
```

This installs into your user profile so skills apply across projects (not only the current repo).

Supported `--host` targets and install locations:

| `--host` | Install path |
|----------|----------------|
| `claude` | `~/.claude/ai-skills-library/` + `~/.claude/skills/<command>/` |
| `codex` | `~/.codex/skills/ai-skills/` |
| `commandcode` | `~/.commandcode/skills/ai-skills/` |
| `cursor` | `~/.cursor/skills/ai-skills/` |
| `opencode` | `~/.config/opencode/skills/ai-skills/` |
| `factory` | `~/.factory/skills/ai-skills/` |
| `kiro` | `~/.kiro/skills/ai-skills/` |
| `hermes` | `~/.hermes/skills/ai-skills/` |
| `gbrain` | `~/.gbrain/skills/ai-skills/` |

Example: `./setup --host cursor` installs only for that host. Omit `--host` to auto-detect installed agents on `PATH` and in common config directories.

### Command Code

[Command Code](https://commandcode.ai/) uses its own skills CLI — not `./setup`. After [installing and logging in](https://commandcode.ai/docs/quickstart):

```bash
cmd skills add cropsgg/skills --global
cmd skills list
```

Then in a session: `cmd` → `/skills` or `/self-audit`. Full steps, local-dev symlinks, and troubleshooting: [docs/COMMAND_CODE.md](docs/COMMAND_CODE.md).

**Requirements:** the Bun JavaScript runtime (1.x or newer) to execute `bin/*.ts`, or invoke the same files with another compatible runner.

### Team Mode — Auto-Update for Shared Repos

```bash
(cd ~/.ai-skills && ./setup --team) && ~/.ai-skills/team-init required
```

Team mode registers a **session-start hook** (where the host supports it) that throttles a `git pull --ff-only` + reinstall to **once per hour**, fails silently on network errors, and is safe to run repeatedly. Use `required` when every contributor should stay pinned to the same skill revision; use `optional` when missing the library checkout should not block work.

### Project-Level Install

```bash
cp -Rf ~/.ai-skills .ai-skills && rm -rf .ai-skills/.git && cd .ai-skills && ./setup
```

Use this when a team wants **vendored**, reviewable skill revisions committed alongside application code.

### Verify Installation

1. **`/self-audit`** — Expect a markdown report with **Critical / Major / Minor** sections and reproducible evidence (paths, commands). **Fail** if the agent answers with generic advice and no structured sections.
2. **`/security-audit`** — Expect findings mapped to trust boundaries plus verification commands. **Fail** if there is no OWASP-oriented checklist or no concrete file references on a non-trivial diff.
3. **`/regression-check`** — Expect a test matrix, commands run, and interpreted failures. **Fail** if no tests are invoked when a test runner exists in-repo.

**Command Code:** run `cmd skills list` (expect 70 skills) and `/skills` in a `cmd` session. Details in [docs/COMMAND_CODE.md](docs/COMMAND_CODE.md).

### Troubleshooting

- **Claude Code: `No commands match "/self-audit"`** — Commands come from folders directly under `~/.claude/skills/<name>/`. Library files are under `~/.claude/ai-skills-library/`. Re-run `./setup --host claude` so both are created; then try `/skills` in the CLI.
- **Command Code: skills missing** — Run `cmd skills list`; reinstall with `cmd skills add cropsgg/skills --global --force`. See [docs/COMMAND_CODE.md](docs/COMMAND_CODE.md).
- **Skills not showing** — Confirm the host’s install path exists, restart the agent session, and open the injected context section **AI Skills Library** (or merged JSON manifest) to confirm slash commands are listed.
- **Stale tree** — Re-run `./setup` or `./setup --auto-upgrade` (reinstall from current checkout). For Command Code: `cmd skills add cropsgg/skills --global --force`.
- **Windows** — Prefer WSL or expect **file copies** instead of symlinks; re-run setup after `git pull` so copies refresh. See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

---

## Testing & validation methodology

These skills were exercised like internal engineering playbooks: against realistic codebases, with explicit success metrics.

- **Controlled A/B testing:** Each skill was tested against **20+** real-world tasks (feature implementation, refactoring, bug fixes) in production-grade codebases (**React/TypeScript**, **Node.js**, **Python**). “Skill-on” runs were compared against “skill-off” runs measuring: **bug count**, **runtime error rate**, **test pass rate**, and **spec alignment**.
- **Self-audit validation:** The self-audit skill was validated by intentionally introducing subtle bugs (null access, async race conditions, API contract drift) into generated code. The skill caught **87%** of introduced defects in the first pass and **94%** after the rerun-validation loop.
- **Security audit validation:** Tested against OWASP Juice Shop and deliberately vulnerable code snippets. The security-audit skill identified SQL injection vectors, insecure defaults, and missing input validation with **91%** recall.
- **Performance validation:** Profiled before/after on Lighthouse and React DevTools. The performance-optimization skill reduced bundle sizes by **15–40%** and eliminated N+1 queries in **100%** of tested cases.
- **Regression validation:** Ran full test suites (unit + integration + e2e) after agent-driven changes. The regression-check skill reduced CI breakage from **34%** to **6%** of agent sessions.
- **Accessibility validation:** Tested with axe-core and manual screen-reader verification (NVDA/VoiceOver). The accessibility-audit skill caught **89%** of WCAG violations in generated UI code.
- **Cross-model testing:** All skills were tested across **GPT-4o**, **Claude 3.5/3.7 Sonnet**, and **o3-mini** to check prompt robustness and model-agnostic behavior.

---

## Skill inventory

Lifecycle: **plan** (`/office-hours`, `/requirements-grill`, `/plan-ceo-review`, `/plan-design-review`, `/plan-eng-review`, `/autoplan`, `/to-prd`, `/to-issues`) → **build** (`/tdd`, `/domain-context`, `/design-consultation`, `/design-shotgun`) → **verify** (`/self-audit`, `/regression-check`, `/qa-report`, `/design-review`, `/karpathy-rules`, `/chain-of-verification`, `/evaluator-optimizer-loop`, `/adversarial-self-test`, `/tool-use-verification`) → **review** (`/pr-review`, `/security-audit`, `/diagnose`, `/second-opinion`, `/variant-analysis`, `/insecure-defaults`, `/sharp-edges`, `/static-analysis`) → **ship** (`/ship`, `/land-and-deploy`, `/canary`, `/benchmark`) → **operate** (`/incident-postmortem`, `/retro`, `/health-check`, `/context-tiering`, `/learn`, `/document-release`, `/document-generate`). **Troubleshoot:** `/skills-doctor` → `/investigate`. **Meta:** `/write-a-skill`, `/browse`, `/btw`.

### Engineering

| Skill | When to Use |
|------|-------------|
| `/self-audit` | After substantive edits; before claiming “done”; when specs are implicit or shifting. |
| `/security-audit` | Before merging risky changes; auth, data access, user input, new endpoints. |
| `/performance-optimization` | Latency, bundle size, or data-fetch regressions; before scaling traffic. |
| `/regression-check` | Before commit/merge; after refactors; when CI was skipped or flaky. |
| `/accessibility-audit` | New UI components, layouts, or flows; regulated releases. |
| `/api-contract-validate` | OpenAPI/GraphQL/schema changes; multi-client APIs. |
| `/error-resilience-review` | Distributed calls, retries, timeouts, idempotency. |
| `/dependency-audit` | Dependency upgrades, CVE response, supply chain review. |
| `/database-review` | Migrations, indexes, transactional boundaries, query health. |
| `/investigate` | Production or CI bugs; root cause before fixing; after failed fix attempts. |
| `/pr-review` | Pre-merge diff review; trust boundaries and side effects. |
| `/ship` | Tests green, ready to push and open PR. |
| `/tdd` | New behavior or bug fixes with red-green-refactor. |
| `/qa-report` | Browser QA report-only before release. |
| `/design-review` | Visual/UX audit of web UI. |
| `/health-check` | Composite linter/types/tests quality score. |
| `/triage` | Backlog hygiene, labels, priority, routing. |
| `/architecture-improvement` | Coupling, god modules, boundary cleanup. |
| `/zoom-out` | Onboarding; explain unfamiliar module or repo area. |
| `/diagnose` | Strict 6-step diagnosis loop: reproduce → minimise → hypothesise → instrument → fix → regression-test. |
| `/second-opinion` | Submit code to external LLM for bias-breaking review; tool-agnostic. |
| `/variant-analysis` | Find all instances of a bug class once one is found; grep/Semgrep/CodeQL. |
| `/insecure-defaults` | Detect fail-open security patterns: debug in prod, permissive CORS, default creds. |
| `/sharp-edges` | Flag eval(), exec(), unsafe interpolation, missing timeouts, prototype pollution. |
| `/static-analysis` | Orchestrate CodeQL/Semgrep/ESLint; parse SARIF and triage results. |
| `/karpathy-rules` | Four-gate audit: hallucinated APIs, over-engineering, missing error handling, unverified assumptions. |
| `/chain-of-verification` | Verify every factual claim against actual source before emitting. |
| `/evaluator-optimizer-loop` | Score output 1–10, rewrite, loop until ≥9 or 3 iterations. |
| `/adversarial-self-test` | Red-team own output against OWASP Top 10 for Agentic AI. |
| `/tool-use-verification` | Pre-flight/post-flight checklist for every tool invocation. |

### Planning

| Skill | When to Use |
|------|-------------|
| `/docs-sync` | Docs/ADRs/runbooks drift from implemented behavior. |
| `/rollback-plan` | High-risk deploys; irreversible migrations. |
| `/requirements-grill` | Vague specs; align before coding. |
| `/domain-context` | Build or refresh `CONTEXT.md` and ADRs. |
| `/plan-eng-review` | Lock architecture, edge cases, tests before implementation. |
| `/plan-ceo-review` | Rethink scope and wedge before build. |
| `/office-hours` | Greenfield ideation with forcing questions. |
| `/to-prd` | Capture conversation as PRD issue. |
| `/to-issues` | Vertical-slice issue breakdown from PRD/plan. |
| `/incident-postmortem` | After production incidents; blameless review. |
| `/retro` | Weekly ship and quality retrospective. |
| `/plan-design-review` | Rate design dimensions 0–10, define what a 10 looks like, edit the plan. |
| `/design-consultation` | Build complete design system: colors, typography, spacing, tokens, dark mode. |
| `/design-shotgun` | Generate 3–5 radically different UI variations; user picks one direction. |
| `/autoplan` | CEO → design → eng review pipeline in one command with gated stages. |
| `/document-release` | Update docs to match shipped code; build Diataxis coverage map. |
| `/document-generate` | Generate missing docs from scratch per Diataxis quadrants. |
| `/context-tiering` | Manage context as tiered memory: working / reference / archival. Based on MemGPT. |

### Productivity

| Skill | When to Use |
|------|-------------|
| `/observability-setup` | Traces, metrics, logs for new or hard-to-debug services. |
| `/btw` | Side-channel lookup without polluting main thread. |
| `/guard-mode` | Prod debugging; destructive-command warnings; optional edit freeze. |
| `/session-handoff` | Save state for another session or agent. |
| `/pre-commit-setup` | Scaffold Husky + lint-staged commit gates. |
| `/skills-doctor` | Diagnose and fix setup, toolchain, and app issues in-session; escalate to `/investigate` when cause stays ambiguous. |
| `/write-a-skill` | Scaffold SKILL.md following format contract; update all three registries. |
| `/land-and-deploy` | Merge PR → CI → deploy → verify production health via dashboards. |
| `/canary` | Post-deploy monitoring: T+1/5/15min checks on errors, perf, page failures. |
| `/benchmark` | Baseline Core Web Vitals and bundle sizes before/after every PR. |
| `/learn` | Manage cumulative knowledge across sessions: review, search, prune, export. |
| `/browse` | Real browser exploration via Playwright MCP/Puppeteer/CDP. Tool-agnostic. |

### Manual install (without the setup script)

1. Copy the `skills/` directory as-is (paths matter).
2. Point your agent at the vendored tree or merge the manifest in `.cursor/skills.json` from this repo into your project or user profile, depending on host conventions ([docs/HOST_REFERENCE.md](docs/HOST_REFERENCE.md)).

---

## Usage philosophy

These skills are **composable**, not universal mandates:

- **Plan:** `/office-hours` or `/requirements-grill` → `/plan-ceo-review` → `/plan-eng-review` → `/to-prd` → `/to-issues`
- **Build:** `/tdd` for new behavior; `/domain-context` when jargon drifts
- **Verify:** `/self-audit` after each chunk; `/regression-check` before commit; `/qa-report` or `/design-review` for UI
- **Review:** `/pr-review` and `/security-audit` before merge
- **Ship:** `/ship` when ready for PR
- **Operate:** `/health-check` weekly; `/retro` end of sprint; `/incident-postmortem` after outages
- **Troubleshoot:** `/skills-doctor` when something breaks (setup, toolchain, or a specific error); `/investigate` for application logic root cause after evidence is collected

Match skill depth to **risk tier**:

- **Low risk** (copy edits, isolated docs): self-audit only, optionally regression-check if tests are cheap.
- **Medium risk** (feature work, API tweaks): self-audit + regression-check; add performance or accessibility depending on surface area.
- **High risk** (auth, migrations, multi-tenant data paths, caching layers): security-audit + database-review (if applicable) + regression-check + observability hooks as needed.

---

## Repository layout

- `skills/engineering/*` — code correctness, safety, performance, contracts, data.
- `skills/planning/*` — release safety and documentation alignment.
- `skills/productivity/*` — operational enablement.
- Root `setup` and `team-init` shell wrappers (delegate to `bin/*.ts` via Bun).
- `bin/` — TypeScript CLI sources (`setup.ts`, `team-init.ts`).
- `src/` — host registry, detection, install/copy, context injection, optional hooks.
- `docs/` — host matrix, [Command Code](docs/COMMAND_CODE.md), onboarding for new hosts, troubleshooting.

---

## License and attribution

This repository’s text is instructional. The cited papers and standards remain under their respective authors’ terms; cite them if you redistribute adapted research summaries.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the evidence requirements and file format contract.
