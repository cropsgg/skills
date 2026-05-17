# Troubleshooting

## Skills do not appear in the agent

1. **Confirm the install path** for your host using [HOST_REFERENCE.md](HOST_REFERENCE.md).
2. **List files** — you should see `skills/engineering/.../SKILL.md` under the install root (or a symlink to this repository’s `skills/` tree).

### Claude Code: `No commands match "/…"`

Claude Code turns each **immediate** folder under `~/.claude/skills/<name>/` (with a `SKILL.md` inside) into `/name`. Library files live under `~/.claude/ai-skills-library/skills/...`; do not nest only there without the top-level `~/.claude/skills/<name>/` links. Re-run `./setup --host claude` from this repo’s latest checkout. First run migrates an old `~/.claude/skills/ai-skills/` bundle aside. Then run `/skills` in Claude Code to confirm they appear.
3. **Restart the agent session** — many tools cache instructions only at startup.
4. **Open the context file** listed in the matrix — verify a `## AI Skills Library` section exists (Markdown) or that JSON contains merged `skills` entries.
5. **Re-run** `./setup --host <flag>` from your checkout; the installer is idempotent.

## Stale skills after `git pull`

- **Unix / macOS (symlinks):** A symlinked `skills/` directory usually tracks the repo immediately. If you used **copies** (Windows or `--no-symlink` behavior), re-run `./setup`.
- **Team mode:** Ensure the session hook is installed and not blocked by permissions. Hooks are intentionally silent on failure—manually run `./setup` once to verify.

## Context file conflicts

The injector **updates** structured manifests by merge and **replaces** the bounded Markdown section between `## AI Skills Library` and the next same-level heading. It does not delete unrelated user content. If you edited that section manually, running setup again will overwrite **only** that section.

## Permission denied on `./setup`

- Mark the entrypoint executable: `chmod +x setup` (Unix).
- Or run via the package runner: `bun run bin/setup.ts -- --host <flag>` (requires [Bun](https://bun.sh) or adapt to your runtime).

## Duplicate skills or slash commands

Each host uses an **isolated install prefix** for file payloads (see [HOST_REFERENCE.md](HOST_REFERENCE.md); Claude uses `~/.claude/ai-skills-library/` plus command links under `~/.claude/skills/`). Collisions occur only if:

- the same skill name is registered twice **inside one manifest** (merge bug—file an issue), or
- two hosts both point at the same directory (misconfiguration—avoid).

## Skills list only in home profile, not the project

Markdown installers update **user-level** context files under your home directory (for example `~/.claude/CLAUDE.md`, `~/.codex/CODEX.md`). If your agent only reads **project-root** instructions, copy the `## AI Skills Library` block into that file once, or add a short pointer to the home file.

## Auto-update hooks (POSIX only)

Session-start hooks are **not** written on **Windows** (they are `/bin/sh` scripts). Use **WSL**, **macOS/Linux**, or run `./setup` manually after `git pull`.

- Hooks throttle to **once per hour**. Delete the timestamp file beside the hook if you intentionally need a forced refresh (advanced).
- **Network-off** environments: expect silent no-op; run `./setup` when online.

## Windows notes

Symlinks often require elevated privileges or Developer Mode. The installer falls back to **recursive file copies** and prints a one-line notice. Re-run setup after pulls to refresh copies. WSL behaves like Linux.

## Still stuck

Open an issue with:

- host flag,
- OS and shell,
- redacted output of `./setup --host …`,
- listing of the install directory (no secrets).
