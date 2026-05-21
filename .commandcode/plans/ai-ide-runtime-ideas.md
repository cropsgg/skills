# AI IDE Runtime Infrastructure — Plugin & Workflow Ideas

## Context

The existing `~/.ai-skills` system is a **stateless Markdown-on-disk skill library** injected into AI IDE context files via a TypeScript installer. It has:

- 36 skills across engineering/planning/productivity domains
- 9 host adapters (Claude Code, Cursor, Codex, Command Code, OpenCode, Factory, Kiro, Hermes, GBrain)
- Context injection via Markdown, JSON, or YAML into host-specific context files
- No persistence, no runtime, no indexing, no cross-session memory
- Skill format: `SKILL.md` with YAML frontmatter, research backing, process steps, and output format

**The core gap:** AI agents forget project context between sessions. Every session starts from scratch.

**The direction:** Build a companion runtime (MCP server or daemon) that provides persistent engineering memory, deterministic workflows, and multi-agent orchestration — while the existing SKILL.md system remains the user-facing command layer.

## Architecture Decision: Layered System

```
┌──────────────────────────────────────────────┐
│  User-facing SKILL.md commands (existing)     │
│  /self-audit, /investigate, /plan-eng-review  │
├──────────────────────────────────────────────┤
│  New: Skill-accessible runtime tools          │
│  (MCP tools or CLI endpoints skills can call)  │
├──────────────────────────────────────────────┤
│  New: Core runtime (daemon or MCP server)     │
│  Memory store, Repo index, Workflow engine     │
├──────────────────────────────────────────────┤
│  Host adapters (existing, extended)           │
│  claude.ts, cursor.ts, commandcode.ts, etc.    │
└──────────────────────────────────────────────┘
```

Skills don't call the runtime directly — the host's agent does, guided by skill instructions. The runtime is infrastructure skills instruct agents to use.

### Runtime Operational Model

**Process lifecycle:** The MCP server is started lazily on first tool invocation per day (detected via a timestamp file at `~/.ai-skills/runtime/.last-session`, same pattern as the existing auto-update hook in `src/lib/auto-update.ts`). It stays alive for the duration of active IDE sessions. A heartbeat file is touched on every tool call; a watchdog goroutine checks every 5 minutes and shuts down the server if no heartbeat in 30 minutes, preventing stale process accumulation.

**Error handling:** Every MCP tool returns structured error responses. If the runtime is unreachable, tools gracefully degrade — Cortex queries return empty (no crash), Cartographer falls back to grep-based approximation, GuardNet skips validation with a warning. The agent session never fails because the runtime is down.

**Concurrency:** SQLite in WAL mode handles concurrent reads and serialized writes. Multiple IDE sessions (different terminal windows, different hosts) can share the same Cortex database. Write conflicts are retried with exponential backoff up to 3 attempts. Cartographer indexer uses file-level locking to prevent duplicate indexing.

**Data versioning:** Cortex and Cartographer databases include a `schema_version` table. On runtime upgrade, migrations run automatically (forward-only, no downgrade). Old schema versions are readable by new runtimes for one major version back. After that, the database is rebuilt from scratch with a warning.

**Security boundary:** The MCP server runs with the user's filesystem permissions (no elevation). Workflow Engine's `validate` commands execute in a shell but are sandboxed to the project root directory (no `cd /`, no `sudo`). Architecture config and workflow YAML are parsed with strict schema validation — unknown keys are rejected. No telemetry data leaves the machine. Cortex data is stored locally only, at `~/.ai-skills/cortex/`. No network calls are made by the runtime itself (the agent may choose to use web search, but the runtime doesn't).

**Repository identity:** Project identity is `sha256(git remote origin + workspace path)`. If a repo is moved, Cortex detects the new path as a new project. A manual merge command (`cortex_merge old-project-id`) allows migrating accumulated knowledge. The old database is not deleted until explicitly purged.

---

## Idea 1: Project Cortex — Persistent Engineering Memory

### Problem
AI agents start every session with zero knowledge of project conventions, architecture decisions, coding style, and historical context. Developers spend the first 10-15 minutes of every session re-explaining how their project works. Team conventions, architectural rules, and past decisions are lost.

### Why Current AI IDEs Fail
- Context injection (e.g., CLAUDE.md, AGENTS.md) is static — it's a single Markdown file manually maintained.
- No mechanism to accumulate and persist decisions made *during* AI sessions.
- No way to learn conventions from the codebase itself.
- Agents can't distinguish between "this is how we do things" and "this was a one-off mistake."

### Proposed System

**Project Cortex** is a structured, queryable memory store that persists across sessions.

**Architecture:**
- **Storage:** SQLite database at `~/.ai-skills/cortex/<project-hash>.db` (one DB per project, keyed by git remote origin + path hash)
- **Memory types:**
  - `convention` — coding patterns, naming rules, lint preferences
  - `decision` — architecture choices with rationale (ADR-linked)
  - `pattern` — recurring code shapes (e.g., "all DB queries go through Repository class")
  - `anti-pattern` — things to avoid (e.g., "never import directly from barrel files in this project")
  - `context-snapshot` — compressed summaries of past sessions (what was worked on, what decisions were made)
- **Ingestion:**
  - Auto-extract from codebase: AST analysis for patterns, git log for commit conventions, eslint/tsconfig for style rules
  - Session-capture: at end of every session, the agent summarizes key decisions into Cortex
  - Manual: `/cortex-add` command for explicit knowledge entry
- **Retrieval:**
  - At session start, relevant Cortex entries are injected into the host context file
  - During session, skills can query Cortex: "what's the error handling pattern in this project?"
  - Search: two-tier approach — exact tag/keyword matching first (fast, SQLite FTS5), then semantic similarity using locally-computed embeddings (all-MiniLM-L6-v2 via ONNX runtime, ~80MB model, runs CPU-only, no network) for fuzzy matching when keywords miss. Phases 1-2 use FTS5 only; embeddings are added in Phase 3 when the heavier dep is justified by volume of stored entries

**Execution Model:**
- MCP server runs as a background process, started on first session of the day
- Context injection at session start pulls top-N relevant entries into AGENTS.md/CLAUDE.md
- Skills reference Cortex via tool calls: `query_cortex("error handling pattern")`
- Writes happen at session end (summarization) or on explicit `/cortex-add`

**Repo Integration:**
- Project identity: sha256 hash of `git remote get-url origin` + workspace path
- Auto-discovery: when agent enters a repo, Cortex checks if this project has a DB
- No `.git` pollution — all data lives in `~/.ai-skills/cortex/`

**Example Usage:**
```bash
# At session start, context auto-injected:
# "This project uses Repository pattern for DB access. Error handling: Result<T, E> not throwing. 
#  Last session (2026-05-20): refactored auth module to use JWT rotation."

# Manual memory operations:
/cortex-add convention "All API responses use { data, error } envelope"
/cortex-add anti-pattern "Don't use process.env directly — use config.ts"
/cortex-search "how do we handle async errors"

# Skill integration (in SKILL.md instructions):
## When investigating, first query Cortex for known patterns:
## cortex_query("error handling in auth module")
```

**Why It's Defensible:**
- SQLite is zero-config, embedded, and works cross-platform
- Per-project isolation prevents context pollution between codebases
- Semantic search over conventions creates compounding value — the more you use it, the better it gets
- Can't be replicated by a single CLAUDE.md file

---

## Idea 2: Repo Cartographer — Architecture Mapping & Impact Analysis

### Problem
When AI agents modify code in a large repo, they can't see the blast radius. Changing a shared type might break 20 consumers. Removing a function might break an undocumented dependency. Current AI IDEs do grep-level "find references" — not structural impact analysis.

### Why Current AI IDEs Fail
- Grep-based reference finding misses indirect dependencies, barrel re-exports, and dynamic imports
- No understanding of module boundaries or architectural layers
- Can't distinguish "internal implementation detail" from "public API surface"
- No visualization of dependency graphs or call chains

### Proposed System

**Repo Cartographer** builds a structural map of the codebase and answers "what happens if I change this?"

**Architecture:**
- **Indexer:** Tree-sitter based AST analyzer (chosen over ts-morph for language-agnostic support and zero Node.js dependency — critical for Bun runtime and cross-platform installs). Runs once on codebase and incrementally updates on file changes. Language grammars are lazily fetched on first encounter (TypeScript, Python, Go, Rust, and 20+ others)
- **Graph database:** SQLite with adjacency tables for:
  - File → exports → consumers
  - Function → callers → callees
  - Type/interface → implementors → users
  - Module → dependencies → dependents
  - Architectural layer membership (e.g., "this is in the data layer")
- **Layer detection:** Configuration file at the project root (`.ai-skills/architecture.json` — note: this is project-level config, distinct from the vendored `.ai-skills/skills/` install path used by the project-level install pattern). Defines layers and allowed dependency directions. On load, the runtime validates: (a) no path overlaps between layers, (b) all globs resolve to existing directories, (c) rule targets reference defined layers. Invalid config is rejected with specific error messages:
  ```json
  {
    "layers": {
      "presentation": ["src/ui/**", "src/pages/**"],
      "application": ["src/services/**", "src/hooks/**"],
      "domain": ["src/models/**", "src/types/**"],
      "infrastructure": ["src/db/**", "src/http/**"]
    },
    "rules": {
      "presentation": { "mayDependOn": ["application", "domain"] },
      "application": { "mayDependOn": ["domain", "infrastructure"] },
      "domain": { "mayDependOn": [] },
      "infrastructure": { "mayDependOn": ["domain"] }
    }
  }
  ```
- **Impact analysis queries:**
  - Direct dependents (immediate importers)
  - Transitive dependents (full ripple)
  - Layer violation detection (circular deps, wrong direction)
  - Dead code (exports with zero consumers)
  - Coupling hotspots (modules with highest fan-in/fan-out)

**Execution Model:**
- Indexer runs as part of the MCP server, triggered on repo open and on file changes
- Incremental indexing: only re-analyze changed files + their dependents
- Skills query via: `cartographer_impact("src/auth/session.ts")` → returns affected files, layer violations, risk score
- Results are injected context-efficiently: file paths + risk levels, not full code

**Example Usage:**
```bash
# Impact analysis before a change:
/impact src/shared/types/user.ts
# → "Changing User interface affects 47 files across 12 modules.
#    Critical: 3 type-only imports, will cause compile errors.
#    Warning: 2 layer violations detected (infrastructure importing from presentation).
#    Dead exports: getFullName is unused."

# Architecture health check:
/arch-health
# → "Layer violations: 3 | Circular deps: 1 | Coupling hotspots: utils/helpers.ts (87 importers)"

# What depends on this function?
/dependents db/connect.ts
# → "Direct: 12 | Transitive: 34 | Layers: infrastructure(8), application(4)"
```

**Why It's Defensible:**
- Tree-sitter gives language-agnostic AST analysis without runtime execution
- Incremental indexing means it's fast even on 100k+ file repos
- Layer enforcement is architecturally opinionated — teams define their own rules
- Impact analysis is something no current AI IDE does well

---

## Idea 3: Workflow Engine — Deterministic, Resumable Agent Pipelines

### Problem
AI coding sessions are one-off, ad-hoc, non-reproducible. If an agent gets halfway through a 5-file refactor and the session crashes, there's no checkpoint — you start over. Complex multi-step operations (migrations, large refactors, multi-module changes) require the developer to manually track progress across sessions.

### Why Current AI IDEs Fail
- Sessions are linear, stateless conversations
- No concept of workflow stages, checkpoints, or resumption
- No way to compose multiple agent operations into a deterministic pipeline
- No validation gates between steps

### Proposed System

**Workflow Engine** is a state machine executor for multi-step AI operations with checkpointing, validation, and resumption.

**Architecture:**
- **Workflow definition:** Declarative YAML describing steps, validation, rollback, and dependencies:
  ```yaml
  name: migrate-auth-to-jwt-rotation
  steps:
    - id: analyze-current
      description: Map current auth flow
      skill: /investigate
      validate: "auth flow diagram produced"
      undo: "rm -f docs/auth-flow.md"
    - id: add-token-store
      description: Create refresh token store
      skill: /tdd
      validate: "pnpm test token-store --pass"
      undo: "git checkout -- src/token-store/"
      depends_on: [analyze-current]
    - id: update-middleware
      description: Update auth middleware to rotate tokens
      validate: "pnpm test auth-middleware --pass"
      undo: "git checkout -- src/middleware/auth.ts"
      depends_on: [add-token-store]
  ```
  Validation commands run in a sandboxed shell restricted to the project root directory. The `undo` field is required for any step that modifies files — if a later step fails, undo actions execute in reverse order to restore known-good state.
- **Execution runtime:** MCP server tracks workflow state (pending/in_progress/done/failed)
- **Checkpoints:** After each validated step, state is persisted. Crash? Resume from last checkpoint.
- **Validation gates:** Each step has a `validate` command. If it fails, workflow pauses — not aborts.
- **Rollback:** Steps define `undo` actions in the YAML. Failed workflow triggers undo actions in reverse dependency order to restore the last known-good state. The MCP server executes undo commands (not the agent — the agent may have crashed).

**Execution Model:**
- Developer defines workflow (or agent generates it from a plan)
- `workflow_run("migrate-auth")` starts execution
- MCP server manages state transitions, runs validation commands, persists checkpoints
- Agent handles each step using the specified skill
- On failure, agent can investigate, fix, and resume

**Example Usage:**
```bash
/workflow-create migrate-auth "Migrate auth system to JWT rotation"
# Agent generates workflow YAML, developer reviews and approves

/workflow-run migrate-auth
# Step 1: /investigate — DONE ✓
# Step 2: /tdd add-token-store — DONE ✓  
# Step 3: /tdd update-middleware — FAILED ✗ (test timeout)
# → Workflow paused. Fix and /workflow-resume

/workflow-resume migrate-auth
# → Resuming from step 3...

/workflow-status
# migrate-auth: step 4/5 | Last checkpoint: step 3
```

**Why It's Defensible:**
- Deterministic: same workflow definition → same sequence of operations
- Resumable: state persisted in SQLite, survives crashes
- Composable: workflows can invoke other workflows as sub-steps
- Observable: state, progress, and failure reasons are queryable
- No current AI IDE has anything like this

---

## Idea 4: GuardNet — Failure Detection, Recovery & Rollback

### Problem
AI agents break things constantly. They make edits that don't compile, introduce runtime errors, break tests, or create security issues. Current "recovery" is the developer manually reverting or the agent guessing at a fix. There's no systematic failure detection, analysis, or recovery.

### Why Current AI IDEs Fail
- No proactive validation — agent makes changes, then developer discovers breakage
- Recovery is ad-hoc: retry, revert, or manual fix
- No pattern learning — the same class of failure repeats across sessions
- No pre-commit safety net beyond linters

### Proposed System

**GuardNet** is a safety system that wraps agent actions with pre/post validation, failure pattern detection, and intelligent recovery.

**Architecture:**
- **Pre-action checks (once per batch of file writes, not per-file):**
  - Lint check on current state (baseline)
  - Test check on current state (baseline)
  - Typecheck on current state (baseline)
- **Post-action checks (after batch of writes completes or agent signals "done"):**
  - Lint diff — only new errors are relevant
  - Test diff — only newly failing tests
  - Typecheck diff — only new type errors
  - Runtime smoke test if configured: a project-defined script (e.g., `pnpm smoke`) that runs a fast (<30s) subset of critical-path tests. Configured via `.ai-skills/guardnet.json` — if absent, skipped. This prevents the naive approach of running full test suites on every edit, which would be prohibitively slow on large repos
- **Failure analysis:**
  - Was the failure caused by this change or pre-existing?
  - Which file(s) introduced the breakage?
  - What class of failure? (type mismatch, missing import, null reference, etc.)
- **Recovery strategies (ordered by safety):**
  1. Auto-fix (simple: missing import, lint autofix)
  2. Suggest fix (agent reviews and applies)
  3. Partial revert (revert only the breaking file, keep others)
  4. Full revert to last known-good state
  5. Escalate to developer with failure report

**Failure Pattern Learning:**
- GuardNet tracks failure signatures across sessions
- "You've hit this same null-check pattern 4 times. Consider adding a lint rule."
- Feeds into Project Cortex as anti-patterns

**Example Usage:**
```bash
# GuardNet is always-on background validation:
# Agent makes changes to 3 files...
GuardNet: Post-change validation
  ✓ Lint: no new errors
  ✓ Typecheck: no new errors  
  ✗ Tests: 2 newly failing in auth.test.ts
  → Failure analysis: "setRefreshToken is now async but test calls it synchronously"
  → Auto-fix: "Added await. Re-running tests..."
  ✓ Tests: all passing

# On unrecoverable failure:
GuardNet: Recovery failed after 3 attempts.
  → Partially reverted: auth/middleware.ts (breaking file)
  → Kept: auth/types.ts, auth/config.ts (no test impact)
  → Report: "setRefreshToken signature change broke 2 test files."
```

**Why It's Defensible:**
- Pre/post validation is a security boundary — stops bad changes before they compound
- Failure pattern learning means it gets better over time
- Partial revert is smarter than "git reset --hard" — preserves good changes
- Directly addresses AI fragility, the #1 developer complaint

---

## Idea 5: Context Router — Intelligent Context Window Management

### Problem
AI agents have limited context windows. On large codebases, they can't fit all relevant files. Current approaches are crude: "read these 5 files" (manual), "auto-attach open tabs" (context-blind), or "dump everything" (bloated). Agents miss dependencies, ignore existing patterns, or load irrelevant code.

### Why Current AI IDEs Fail
- Manual file selection: developer must know exactly what's relevant
- Tab-based selection: whatever's open, regardless of relevance to the task
- No understanding of *why* a file matters to the current task
- Context decay: as conversation grows, early context gets pushed out

### Proposed System

**Context Router** dynamically manages what code enters the agent's context window based on the current task intent, architectural relevance, and context budget.

**Architecture:**
- **Intent classifier:** Parses the task to identify what parts of the codebase are relevant
- **Relevance scoring:** Uses Repo Cartographer's dependency graph to score files
- **Budget-aware packing:** Given a token budget (e.g., 40K tokens for context), select optimal file set. Three loading strategies per file:
  - **Full:** Load entire file (default, used for files under 300 lines)
  - **Structure-only:** Tree-sitter extracts function/class signatures, exports, type declarations — no bodies. Generated at index time by Cartographer, stored alongside the graph. ~80-90% token reduction. Used for dependency files the agent needs to know about but not deeply read
  - **Summary:** For files over 500 lines that aren't high priority, a one-paragraph summary generated by Cartographer's static analysis (purpose, key exports, dependencies, ~50 tokens). LLM summarization is explicitly NOT used — too expensive and slow for context routing
- **Dynamic reprioritization:** As the task evolves, context router can swap files in/out
- **Context decay prevention:** Older conversation segments (>20 messages back) are compressed by the agent itself using the Cortex summarization tool into structured decision records. The runtime provides the `context_compress` tool; the agent decides when to use it

**Execution Model:**
- Context Router is a tool the agent calls: `context_route("Add Stripe payment endpoint to checkout flow")`
- Returns prioritized file list with summaries
- Agent loads files in priority order, stopping at budget
- On context pressure, agent calls `context_swap(old_file, new_file)` to manage window

**Example Usage:**
```bash
# Agent receives task: "Add rate limiting to the API"
context_route("Add rate limiting to REST API")
# → Priority files (budget: 40K tokens):
#   1. src/server/app.ts (route mounting, 5K tokens) — score 10
#   2. src/middleware/auth.ts (existing middleware pattern, 3K tokens) — score 8
#   3. src/config/rate-limit.ts (config patterns, 2K tokens) — score 7
#   4. package.json (dependencies, 1K tokens) — score 5
#   5. src/server/types.ts (middleware types, summary only, 0.5K tokens) — score 5
#   Total: 11.5K of 40K budget
```

**Why It's Defensible:**
- Dependency-graph-aware routing is fundamentally better than tab-based or manual selection
- Budget-aware packing is critical for large codebases
- Dynamic reprioritization means context stays relevant as the task evolves
- Decay prevention (compressing old conversation) is essential for multi-hour sessions

---

## Idea 6: Multi-Agent Coordinator — Specialized Agent Orchestration

### Problem
A single AI agent doing everything produces mediocre results. It's the same "brain" trying to be creative designer, careful implementer, and critical reviewer — roles that need different thinking modes.

### Why Current AI IDEs Fail
- Single-agent model: no separation of concerns
- "Review" is the same agent reviewing its own work — blind spots are guaranteed
- No way to have an architecture agent enforce rules while an implementation agent codes

### Proposed System

**Multi-Agent Coordinator** orchestrates specialized sub-agents with formal handoffs and validation gates.

**Architecture:**
- **Orchestrator agent:** Manages the workflow, dispatches sub-agents, validates handoffs
- **Specialized sub-agents (stateless, launched per task):** Architect, Implementor, Reviewer, Test Writer, Documenter
- **Handoff protocol:** Each sub-agent receives task spec + context; produces structured output + validation evidence
- **Agent isolation:** Reviewer sees the Architect's plan output plus a curated "rationale summary" — the key decisions and their motivations, but not the full deliberation trace. This prevents self-review blind spots while preserving critical context (e.g., "chose Result<T,E> pattern because error codes must be machine-readable by the mobile client"). If the Reviewer needs clarification on a decision, it can request it via the Orchestrator — the Architect's full reasoning is stored in the workflow state, not discarded
- **Cost and latency:** A typical 5-agent pipeline (Architect → Implementor → Test Writer → Reviewer → Documenter) uses 5 sequential LLM calls. For a task that a single agent completes in 3 minutes with 1 call, the multi-agent version takes 8-12 minutes with 5 calls. This is a deliberate tradeoff: higher cost and latency for higher quality and fewer post-hoc fixes. Agents run in parallel where the dependency graph allows (Test Writer + Documenter can run simultaneously after Implementation)

**Execution Model:**
- Orchestrator is a state machine (built on Workflow Engine)
- Each sub-agent invocation is a fresh agent session with role-specific system prompt
- Handoffs are structured JSON: plan → implementation → review → verdict
- Runs agents in parallel where task graph allows

**Example Usage:**
```bash
/agent-task "Add OAuth2 JWT rotation with refresh tokens"
# Orchestrator dispatches:
#   1. Architect: produces design doc, component diagram, edge cases
#   2. [Orchestrator validates design]
#   3. Implementor: codes auth middleware, token store, rotation logic
#   4. [Orchestrator runs GuardNet validation]
#   5. Test Writer: generates test suite
#   6. Reviewer: security audit + regression check
#   7. Documenter: updates ADR and API docs
#   8. [Orchestrator: all gates passed → final report]
```

**Why It's Defensible:**
- Role separation is the core insight of software teams — applied to AI agents
- Reviewer ≠ Implementor prevents self-review blind spots
- Formal handoffs prevent "design drift" during implementation
- Built on Workflow Engine, so it's resumable and observable

---

## Idea 7: Session Historian — Debugging Memory & Execution Replay

### Problem
When an AI agent's change breaks something days later, there's no record of what happened, why decisions were made, or what the agent was thinking. Failed reasoning is lost.

### Why Current AI IDEs Fail
- Sessions are ephemeral — chat history exists but isn't structured or queryable
- No linkage between "this code change" and "this reasoning that produced it"
- Can't replay a failed session to understand what went wrong
- No debugging timeline for agent-caused issues

### Proposed System

**Session Historian** records structured session data (decisions, changes, failures, reasoning) and enables post-hoc analysis and replay.

**Architecture:**
- **Session record:** Stored in Cortex DB, linked to git commits (task intent, files changed, decision points with reasoning, validation results, failures and recovery actions)
- **Replay:** Reconstruct a past session by loading its context state and decision tree. **Limitations acknowledged:** Full replay requires (a) the same codebase state — Historian records the git commit SHA but cannot checkout mid-session, so replay loads current code + recorded diff; (b) the same LLM model version, which may no longer be available — replay uses the closest available model with a warning; (c) non-deterministic LLM outputs mean replay is approximate, not byte-for-byte. The primary value is forensic analysis of decisions and failure points, not exact reproduction
- **Timeline view:** Visual or text-based timeline of a session
- **Failure forensics:** Query: "What sessions touched this file? What decisions led to this pattern?"

**Example Usage:**
```bash
/session-history
# → "Last 5 sessions in this project:
#   2026-05-21 14:02: Added payment endpoint (3 files, 1 decision)
#   2026-05-20 10:15: Refactored auth middleware (8 files, 4 decisions)"

/session-replay 2026-05-20-auth-refactor
# → Reconstructs context and decision tree from that session

/why-this-code src/auth/middleware.ts:142
# → "Added 2026-05-20 during auth refactor.
#    Decision: 'Use Result<T, E> instead of throwing — matches project convention'
#    Context at time: loading error-handling.md, auth-types.ts, user-service.ts"
```

**Why It's Defensible:**
- Debugging memory is the #1 missing piece in AI-assisted development
- Replay capability means you can learn from agent failures
- Links code to reasoning — the "why" is preserved, not just the "what"

---

## Idea 8: MigrateKit — Autonomous Safe Refactoring

### Problem
Framework upgrades, API migrations, and large-scale refactors are dangerous and tedious. AI agents can make changes but can't verify safety at scale. Developers must manually verify every change across hundreds of files.

### Why Current AI IDEs Fail
- Can generate migration code but can't validate it across the full codebase
- No understanding of "this change is safe for 95% of files but breaks these 12"
- No automated rollback per-file when validation fails

### Proposed System

**MigrateKit** combines Repo Cartographer's impact analysis with GuardNet's validation to execute safe, verified migrations.

**Architecture:**
- **Migration plan:** Generated from Cartographer's dependency graph. Critically distinguishes between two migration classes:
  - **Mechanical rename:** Same API surface, different package or name (e.g., `lodash/map` → native `Array.map`, `moment` → `date-fns` with equivalent function signatures). Low risk, can be batched and auto-applied
  - **API migration:** Different semantics, different error handling, different call patterns (e.g., `axios` → `fetch` — interceptors, cancel tokens, progress events have no direct equivalents). Each affected file requires individual agent handling with semantic understanding, not mechanical substitution
- **Batched execution:** Mechanical renames auto-applied in bulk batches; API migration files handled individually by the agent
- **Per-batch validation:** GuardNet runs after each batch
- **Per-file rollback:** If one file in a batch fails, only that file reverts
- **Pattern learning:** Recurring migration patterns feed into Cortex

**Example Usage:**
```bash
/migrate "Replace axios with fetch in all API calls"
# Cartographer: Found 312 files using axios.
#   Low risk (mechanical): 298 files
#   Medium risk (interceptors): 10 files
#   High risk (streaming): 4 files
# Plan: 3 batches.

/migrate-run
# Batch 1: 298 files → 295 pass, 3 reverted (FormData edge case)
# Batch 2: 10 files → 10 pass
# Batch 3: 4 files → 4 pass
# → Migration complete: 309/312 files migrated, 3 rolled back safely
```

**Why It's Defensible:**
- Impact analysis before migration → no surprises
- Batched execution with per-file rollback → safety without stalling
- Pattern learning means recurring migrations get faster

---

## Idea 9: OnboardKit — Instant Repo Comprehension

### Problem
New developers (and AI agents) spend hours or days understanding a new codebase. Onboarding knowledge is tribal — exists in developers' heads, not in tooling.

### Why Current AI IDEs Fail
- Agents need explicit instructions about which files to read
- No pre-built architecture map to load into context
- Can't distinguish "important, read this" from "boilerplate, skip this"

### Proposed System

**OnboardKit** generates a complete, queryable architecture understanding of any repo in minutes.

**Architecture:**
- **Static analysis phase:**
  - Entry points (CLI, HTTP server, worker)
  - Module graph with dependency directions (delegates to Cartographer)
  - Architecture layers detected or configured
  - Technology stack fingerprint (framework versions, key dependencies — extracted from package.json, Cargo.toml, go.mod, etc.)
  - Key patterns detected via structural heuristics (not AI inference): error handling patterns identified by consistent Result/Either usage, data access patterns by ORM/query builder import sites, auth patterns by middleware chain structure, routing patterns by framework-specific route registration calls. These are structural fingerprints, not semantic understanding — they identify the *shape* of patterns, not their intent
- **Dynamic analysis phase (strictly optional, opt-in, gated on project buildability):**
  - Requires a `.ai-skills/onboard.json` config specifying `devCommand` and `healthEndpoint`. If absent or the command fails, dynamic analysis is silently skipped
  - Test coverage: runs `test --coverage` to map high/low coverage areas
  - HTTP request trace: fires one request to the health endpoint and traces the middleware/controller path through the code. Single request, no load, no data mutation
  - NOT attempted: profiling, load testing, data seeding, environment setup. OnboardKit does not configure databases or install dependencies — it only uses what's already running
- **Output artifacts:** ARCHITECTURE.md, Cortex entries, Context Router index
- **Interactive exploration:** `/explain-file`, `/trace-request`, `/what-depends-on`

**Example Usage:**
```bash
/onboard
# → "Analyzing repo... Found: Next.js 14 app with 847 source files.
#    Architecture: App Router with layered structure.
#    Entry: src/app/layout.tsx → pages → services → repositories → DB.
#    Generated: ARCHITECTURE.md, Cortex entries (23 patterns).
#    Ready. Ask me anything about this codebase."

/explain-file src/services/billing/stripe.ts
# → "Stripe integration service. Handles: payment intents, webhooks, refunds.
#    Called by: checkout flow, billing dashboard, admin refund tool.
#    Key patterns: Result<T, E> error handling, idempotency via UUID keys."
```

**Why It's Defensible:**
- Solves the "cold start" problem for both humans and AI agents
- Generated artifacts feed all other systems (Cortex, Cartographer, Context Router)
- The onboarding gap is universal — every developer faces it on every new project

---

## Idea 10: Codex Bridge — Cross-IDE Agent Compatibility Layer

### Problem
Skills and runtime tools built for one AI IDE don't work in others. Developers switch between Cursor, Claude Code, and Command Code but have to rebuild their workflow each time.

### Why Current AI IDEs Fail
- Each IDE has its own tool/plugin APIs (Claude has MCP, Cursor has extensions, Codex has something else)
- No cross-IDE standard for agent-accessible tools
- Skills can be shared (Markdown is universal) but runtime capabilities can't

### Proposed System

**Codex Bridge** extends the existing host adapter system to include runtime tool registration, making the companion MCP server's capabilities available across all hosts.

**Architecture:**
- Extended `HostConfig` type with `runtimeSupport` fields (protocol, tools manifest, startup command)
- **Tool manifest:** JSON document at `~/.ai-skills/tools.json` (or per-host equivalent), using a simplified MCP-compatible schema:
  ```json
  {
    "tools": [
      {
        "name": "cortex_query",
        "description": "Query the project's persistent memory store",
        "inputSchema": {
          "type": "object",
          "properties": { "query": { "type": "string" } },
          "required": ["query"]
        },
        "hosts": ["claude", "commandcode", "cursor"]
      },
      {
        "name": "cartographer_impact",
        "description": "Analyze impact of changing a file",
        "inputSchema": {
          "type": "object",
          "properties": { "file": { "type": "string" } },
          "required": ["file"]
        },
        "hosts": ["*"]
      }
    ]
  }
  ```
  The `inputSchema` follows JSON Schema (draft-07). The `hosts` array lists which hosts register this tool — `"*"` means all. This is the canonical registry; each host adapter translates to host-specific format (MCP server config for Claude, `cmd tools` for Command Code, etc.)
- **Host-specific adapters:** MCP registration for Claude Code, Command Code, Cursor; CLI-based fallback for all other hosts. **Acknowledged limitation:** CLI fallback hosts receive tool output as raw text rather than structured JSON, degrading context-efficiency. SKILL.md instructions for those hosts include explicit CLI invocation syntax as a secondary path. As more hosts adopt MCP (Factory, Kiro, Hermes, GBrain are all potential candidates), the fallback set shrinks
- Skills reference tools by name: the host determines how to invoke them

**Example Usage:**
```bash
# Setup with runtime:
./setup --host claude --with-runtime
# → Installs skills + registers MCP server + starts runtime daemon

# Skill usage (agent-agnostic):
# In any SKILL.md:
# "Before investigating, query Cortex for known patterns using the cortex_query tool."
```

**Why It's Defensible:**
- Builds directly on the existing host adapter system
- MCP is emerging as a standard — betting on the right protocol
- Skills remain the user-facing abstraction; runtime is infrastructure
- Cross-IDE compatibility is the moat — no other skill system has it

---

## Implementation Phasing

### Phase 1: Foundation (Runtime Core)
1. MCP server scaffold (TypeScript, Bun runtime)
2. SQLite-based Cortex memory store
3. Basic context injection: load Cortex entries into host context at session start
4. Two new skills: `/cortex-add`, `/cortex-search`
5. Extended `HostConfig` with `runtimeSupport`
6. MCP registration in `./setup` for Claude Code and Command Code

### Phase 2: Intelligence Layer
1. Repo Cartographer indexer (Tree-sitter based)
2. Impact analysis queries
3. Context Router (dependency-graph-aware)
4. Skills: `/impact`, `/dependents`, `/arch-health`, `/onboard` (basic: generates ARCHITECTURE.md + Cortex entries from Cartographer data)

### Phase 3: Safety & Workflow
1. GuardNet pre/post validation
2. Workflow Engine state machine
3. Failure pattern learning → Cortex integration
4. Skills: `/guard-check`, `/workflow-create`, `/workflow-run`

### Phase 4: Multi-Agent & Advanced
1. Multi-Agent Coordinator
2. Session Historian
3. MigrateKit
4. OnboardKit (full: adds interactive exploration — `/explain-file`, `/trace-request`, `/what-depends-on` — on top of the Phase 2 basic `/onboard` artifact generation)

---

## Verification

Each phase is verified by:

1. **Unit tests:** TypeScript test suite for runtime components (Vitest)
2. **Integration tests:** End-to-end skill invocation across at least 2 hosts
3. **Manual smoke test:** Install on a 50k+ LOC real-world repo, verify Cortex builds, Cartographer indexes, GuardNet validates
4. **Cross-host test:** Same skill works on Claude Code and Command Code
5. **Performance:** Cartographer index under 30s for 50k files, Cortex query under 100ms
