# Adding a host

This guide explains how to add support for a new AI coding agent (a **host**) to the cross-installer in this repository. Assume the agent loads skills from disk and can read a project or user-level context file.

## 1. Confirm skill loading semantics

Before writing code, answer:

1. Where does the agent look for skill folders (user profile vs project)?
2. Does it scan a directory tree, read a JSON manifest, or both?
3. Is there a documented “context” or “instructions” file (Markdown, JSON, YAML)?

Write these down in your pull request.

## 2. Add a `HostConfig` module

1. Create `src/hosts/<flag>.ts` exporting a single object that satisfies `HostConfig` in [`src/hosts/types.ts`](../src/hosts/types.ts).
2. Use the `flag` string users will pass to `./setup --host <flag>`.
3. Set `installPath` to a stable directory under the user home directory, for example `~/.myagent/skills/ai-skills`.
4. Set `contextHomeRelative` (path under the user home directory, e.g. `.claude/CLAUDE.md`) and `contextFormat` to match how the agent reads instructions:
   - Markdown context → `contextFormat: "markdown"` and inject a `## AI Skills Library` section.
   - JSON manifest → `skillLoader: "skills-json"` (or `"manifest-json"`) and merge carefully.
5. Set `skillLoader` to `"directory-scan"` when the agent discovers `SKILL.md` files recursively.
6. If the host supports startup hooks, set `sessionHookPath` and `supportsAutoUpdate: true`. Otherwise set `supportsAutoUpdate: false`.

## 3. Register the host

1. Open [`src/hosts/index.ts`](../src/hosts/index.ts).
2. Import your config and append it to the exported `HOSTS` array.
3. Export detection logic if needed from [`src/lib/detect.ts`](../src/lib/detect.ts):
   - Prefer non-invasive checks: `which <binary>` when reliable, else existence of `~/.<agent>/`.

## 4. Document the host

1. Add a row to [`HOST_REFERENCE.md`](HOST_REFERENCE.md) with flag, install path, context file, loader, auto-update support, and version.
2. Add the flag and path to the install table in the root [`README.md`](../README.md) under **Installation — 30 Seconds**.

## 5. Test locally

From a clean shell:

```bash
cd /path/to/ai-skills-library
./setup --host <flag>
```

Verify:

1. The install directory exists and contains a `skills` tree (symlink on Unix, copy on Windows).
2. The context file gains a single `## AI Skills Library` section (Markdown) or merged JSON (no duplicate blocks).
3. Running `./setup` a second time does **not** duplicate sections.

## 6. Open a pull request

Include:

1. The new host file and registry updates.
2. Screenshots or logs (redact secrets) showing successful install.
3. Notes about detection false positives/negatives.

## 7. Common pitfalls

- **Wrong context root:** Some agents read `AGENTS.md` in-repo while skills live under `~/.config/...`. Encode this precisely in `contextHomeRelative` and test both.
- **JSON merge collisions:** Never wipe user-owned keys. Deep-merge only the `skills` array you own.
- **Hooks that chatter:** Auto-update scripts must be silent on failure and throttled (timestamp file).
- **Windows:** Use copies instead of symlinks when `process.platform === "win32"`.

## 8. Naming and neutrality

Keep user-facing prose vendor-neutral. The **flag** string and `installPath` are identifiers, not marketing copy. Prefer “host”, “agent session”, and “tooling” in docs.

Maintainers may request changes if detection is too brittle or if install paths conflict with another host.
