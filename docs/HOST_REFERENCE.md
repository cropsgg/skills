# Host reference

Supported hosts, install locations, context files, and loader behavior. Paths use `~` for the user home directory.

| Host | Flag | Install path | Context file | Skill loader | Auto-update hook | Since |
|------|------|--------------|--------------|--------------|------------------|-------|
| Claude Code | `claude` | `~/.claude/ai-skills-library/` (files); `/command` roots at `~/.claude/skills/<command>/` | `~/.claude/CLAUDE.md` | directory-scan | yes | 1.0.0 |
| Codex CLI | `codex` | `~/.codex/skills/ai-skills/` | `~/.codex/CODEX.md` | directory-scan | yes | 1.0.0 |
| Cursor | `cursor` | `~/.cursor/skills/ai-skills/` | `~/.cursor/skills.json` | skills-json | no | 1.0.0 |
| OpenCode | `opencode` | `~/.config/opencode/skills/ai-skills/` | `~/.config/opencode/AGENTS.md` | manifest-json | no | 1.0.0 |
| Factory Droid | `factory` | `~/.factory/skills/ai-skills/` | `~/.factory/FACTORY.md` | directory-scan | yes | 1.0.0 |
| Kiro | `kiro` | `~/.kiro/skills/ai-skills/` | `~/.kiro/KIRO.md` | directory-scan | yes | 1.0.0 |
| Hermes | `hermes` | `~/.hermes/skills/ai-skills/` | `~/.hermes/HERMES.md` | directory-scan | yes | 1.0.0 |
| GBrain | `gbrain` | `~/.gbrain/skills/ai-skills/` | `~/.gbrain/GBRAIN.md` | directory-scan | yes | 1.0.0 |

## Loader meanings

- **directory-scan:** Agent discovers `SKILL.md` files under the install tree; the installer links or copies the `skills/` subtree. **Claude Code:** the canonical repo tree is kept under `~/.claude/ai-skills-library/skills/...` (not under `~/.claude/skills/`, matching gstack-style layouts). The installer adds one symlink or copy per slash command under `~/.claude/skills/<command>/` because Claude Code only registers `/command` for immediate children of `~/.claude/skills/`.
- **skills-json:** Installer merges skill metadata into a JSON manifest (array under `skills` or host-specific shape) without duplicating entries.
- **manifest-json:** Installer writes `skills-manifest.json` under the install root with absolute paths to each `SKILL.md`.

## Auto-update

When **Auto-update hook** is **yes**, team mode can install a **session-start hook** that:

- runs at most once per hour,
- performs `git pull --ff-only` in the library checkout and re-runs `./setup --host <flag>`,
- exits silently if the network or git fails.

Hosts without hook support still benefit from `./setup --team` for documentation and project references; reinstall manually or from CI.

## Context injection rules

- Markdown hosts: a single `## AI Skills Library` section is appended or replaced in-place; older duplicates are removed before insert.
- JSON hosts: arrays are merged by skill `name`; user-added unrelated keys are preserved; `library` metadata is refreshed from the template in this repository’s `.cursor/skills.json` when installing the `cursor` host.

## Related docs

- [ADDING_A_HOST.md](ADDING_A_HOST.md) — contribute a new row to this matrix.
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — fix install and detection issues.
