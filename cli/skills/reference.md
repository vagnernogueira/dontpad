# dontpad CLI — Command Reference

Full syntax and behavior for every `dontpad` subcommand. Consult on demand while constructing a
command in Step 3 of `SKILL.md` — the Step 2 table already covers the common case.

### `dontpad get`

Read a Dontpad document by path or full URL; print or export the raw Markdown.

```bash
dontpad get <document> [--base-url <url>] [--master-password <pw>] [--password <pw>] [--output <file>] [--no-print]
```

Uses `GET /api/document-content` when a master password is available, otherwise falls back to
`GET /api/public-document-content`.

### `dontpad update`

Update a Dontpad document's content using the Yjs/WebSocket sync flow.

```bash
dontpad update <document> [--stdin | --content <text> | --file <path>] [--base-url <url>] [--ws-base-url <url>] [--master-password <pw>] [--password <pw>]
```

Reads the current content over HTTP first; if it is unchanged, exits without opening a write
session.

### `dontpad create`

Create a new Dontpad document with inline, file, or stdin content.

```bash
dontpad create <document> [--stdin | --content <text> | --file <path>] [--base-url <url>] [--ws-base-url <url>] [--master-password <pw>] [--password <pw>]
```

Proceeds only when the current content is empty after `trim()`, matching the backend's
empty-document convention.

### `dontpad config`

Inspect or update the persisted CLI configuration (`~/.config/dontpad/cli.json`, or
`$XDG_CONFIG_HOME/dontpad/cli.json`).

```bash
dontpad config set [--base-url <url>] [--ws-base-url <url>] [--master-password <pw>] \
  [--clear-ws-base-url] [--clear-master-password] \
  [--auto-update-enabled <true|false>] [--auto-update-interval <hours>]
dontpad config show [--reveal-master-password]
dontpad config path
```

`config init` is an alias of `config set` with identical flags. `baseUrl` is required on first
use; `wsBaseUrl` is optional and derived from `baseUrl` when omitted. Background update checks
default to every 24 hours (`--auto-update-interval` accepts 1–8760).

### `dontpad cli update`

Check for a published CLI release and securely update the **standalone binary in place**.

```bash
dontpad cli update --check-only
dontpad cli update [--force] [--yes]
```

Only accepts stable `cli-vX.Y.Z` tags and official Dontpad GitHub release assets. The SHA-256
checksum is required and verified before the atomic replacement; the previous binary is kept as
`<binary>.bak` and restored automatically if final verification fails. Does **not** touch npm
installations (use `npm update -g dontpad-cli` for those) and is disabled on Windows, where a
running `.exe` cannot be replaced atomically.

### `dontpad skill`

Manage the dontpad-cli Claude Code skill installation from GitHub releases.

```bash
dontpad skill install   [--target <path>] [--force] [--json]
dontpad skill update    [--target <path>] [--force] [--json]
dontpad skill status    [--target <path>] [--json]
dontpad skill uninstall [--target <path>] [--force] [--json]
```

The skill artifact (`skills.tar.gz`) is downloaded from the latest release tagged `cli-v*`,
SHA-256 verified, extracted, and atomically swapped into the target directory (default
`~/.agents/skills/dontpad-cli`). Metadata is persisted at `~/.config/dontpad/skill.json`. To make
the skill visible to Claude Code, symlink it into `~/.claude/skills/dontpad-cli`, e.g.:

```bash
ln -sf ../../.agents/skills/dontpad-cli ~/.claude/skills/dontpad-cli
```
