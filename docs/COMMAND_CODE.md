# Command Code

[Command Code](https://commandcode.ai/) is an agentic coding CLI (`cmd`) with native [Agent Skills](https://commandcode.ai/docs/skills) support. This library ships skills that follow the [Agent Skills open standard](https://agentskills.io/); Command Code discovers them from disk — no `./setup` script required.

Official references:

- [Quickstart](https://commandcode.ai/docs/quickstart)
- [Skills overview](https://commandcode.ai/docs/skills)
- [Skills commands (`cmd skills`)](https://commandcode.ai/docs/skills/commands)

---

## Prerequisites

Install the CLI and authenticate once:

```bash
npm i -g command-code@latest
cmd login
```

Verify:

```bash
cmd --version
cmd status
```

---

## Install this library

Command Code installs skills with **`cmd skills add`**, not `./setup --host …`.

### Global (recommended)

Available in every project on your machine:

```bash
cmd skills add cropsgg/skills --global
```

For a multi-skill repo, Command Code shows an interactive picker. To install everything non-interactively (overwrite existing copies):

```bash
cmd skills add cropsgg/skills --global --force
```

Install a single skill:

```bash
cmd skills add cropsgg/skills -s self-audit --global
cmd skills add cropsgg/skills -s security-audit --global
```

### Project-level

Only for the current working directory:

```bash
cmd skills add cropsgg/skills
```

Skills land under `.commandcode/skills/<skill-name>/`.

---

## Verify installation

From any shell:

```bash
cmd skills list
```

Expect **36 skills** in the Global or Project section (engineering, planning, and productivity skills from this repo).

In an interactive session:

```bash
cmd
/skills
/self-audit
```

- `/skills` — browse installed skills; press Enter to open a skill in `$EDITOR`.
- `/self-audit`, `/security-audit`, etc. — invoke a skill for the current turn.

No restart is required after `cmd skills add`; changes apply on the next prompt.

---

## Install locations

| Scope | Path | Flag |
|-------|------|------|
| Global | `~/.commandcode/skills/<skill-name>/` | `--global` or `-g` |
| Project | `.commandcode/skills/<skill-name>/` | (default) |

Command Code also discovers `.agents/skills/` (user and project) for compatibility. On name conflicts, `.commandcode/skills/` wins. See [selection priority](https://commandcode.ai/docs/skills#selection-priority) in the Command Code docs.

---

## Local development (this checkout)

When testing changes before pushing to GitHub, symlink skill folders into Command Code’s global skills directory:

```bash
mkdir -p ~/.commandcode/skills
for dir in skills/*/*/; do
  name="$(basename "$dir")"
  ln -sf "$(pwd)/$dir" "$HOME/.commandcode/skills/$name"
done
cmd skills list   # expect 36 skills
```

To refresh one skill after edits:

```bash
ln -sf "$(pwd)/skills/engineering/self-audit" ~/.commandcode/skills/self-audit
```

After editing `SKILL.md`, save the file — Command Code picks up changes without reinstalling.

---

## Update or remove skills

```bash
cmd skills add cropsgg/skills --global --force   # refresh from GitHub
cmd skills remove self-audit --global            # uninstall one skill
cmd update                                       # update Command Code itself
```

---

## Troubleshooting

### `No skills installed` after install

Run `cmd skills list` and confirm paths:

- Global: `~/.commandcode/skills/`
- Project: `.commandcode/skills/` in the directory where you ran `cmd`

Re-run `cmd skills add cropsgg/skills --global --force`.

### Slash command not found in session

1. Confirm the skill appears in `cmd skills list`.
2. Type `/skills` in the session — installed skills also appear in the `/` menu.
3. If the skill name collides with a built-in or custom command, Command Code shows a `[skill]` badge and **shadowed by** note; the built-in wins. See [name collisions](https://commandcode.ai/docs/skills/commands#name-collisions).

### Skill disabled

Disabled skills are listed in `~/.commandcode/settings.json` under `disabledSkills`. Toggle in `/skills` or remove the name from that array.

---

## Relation to `./setup`

The Bun-based `./setup` installer in this repository targets Claude Code, Cursor, Codex, OpenCode, and other hosts listed in [HOST_REFERENCE.md](HOST_REFERENCE.md). **Command Code uses its own installer** (`cmd skills add`). You can use both on the same machine; install paths are separate.
