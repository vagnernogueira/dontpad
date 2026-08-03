---
name: dontpad-cli
description: >
  Use this skill for any request involving Dontpad Markdown documents — reading, exporting,
  creating, or updating documents via the existing HTTP and Yjs/WebSocket flows of a self-hosted
  Dontpad instance — or for installing, configuring, updating, or troubleshooting the `dontpad`
  CLI itself. Trigger this skill whenever the user asks to fetch, write, or create a Dontpad
  document from the terminal, run any `dontpad get/update/create/config` command, install or
  update the standalone `dontpad` binary (`dontpad cli update`), or manage the `dontpad-cli`
  Claude Code skill (`dontpad skill install/update/status/uninstall`) — even if they only say
  "dontpad" without naming a specific subcommand.
---

# dontpad-cli — Dontpad Document CLI

CLI tool for a [self-hosted Dontpad](https://github.com/vagnernogueira/dontpad) instance. Reads,
exports, creates, and updates Markdown documents using the same HTTP and Yjs/WebSocket sync the
web editor uses — no browser needed. Also manages its own binary updates and its own Claude Code
skill installation, both sourced from GitHub Releases.

## When to use

Trigger this skill when the user's request matches **any** of the following:

### Reading / exporting documents

- Read a document by path or full URL (e.g. "get me/todo from dontpad")
- Export a document's raw Markdown to a local file
- Read a locked document through the public endpoint with `--password`
- Fetch the `?raw`, `?view`, or `?pdf` content of a document

### Creating / updating documents

- Create a new document from inline content (e.g. "create drafts/note with this text")
- Update an existing document's content from stdin, a file, or `--content` (uses Yjs/WebSocket sync)
- Append or replace Markdown on a Dontpad URL

### Configuration

- Inspect or set the persisted CLI config (`baseUrl`, `wsBaseUrl`, `masterPassword`, auto-update settings)
- Resolve the config file path (`dontpad config path`)

### CLI self-update

- Check whether a newer `cli-v*` release is available (`dontpad cli update --check-only`)
- Update the standalone binary in place (`dontpad cli update`)

### Skill self-management

- Install / update / inspect / remove the dontpad-cli Claude Code skill from a GitHub release
- Check whether the installed skill matches the latest `cli-v*` release

## When NOT to use — redirect to other skills

| If the user asks about… | Redirect to |
|---|---|
| **The Dontpad backend/frontend codebase** (not document operations) | Work directly in the repo; this skill only drives the CLI |
| **Generic Markdown editing** with no Dontpad instance involved | A plain editor or filesystem skill |
| **DeFi / AAVE / DefiLlama data** | `aave-cli` or `llama-cli` skills |

> **Redirect template:** "The `dontpad-cli` only operates on Dontpad documents and the `dontpad`
> binary/skill itself. That request is outside its scope."

## Workflow

### Step 0 — Skill self-management

Before using dontpad-cli, ensure the skill is installed and current:

```bash
dontpad skill install
dontpad skill update
dontpad skill status
```

### Step 1 — Prerequisites check

1. **Check if the CLI is installed:**
   ```bash
   which dontpad 2>/dev/null
   ```
2. **If not installed**, prefer the standalone binary from
   https://github.com/vagnernogueira/dontpad/releases (look for `cli-v*` tags, e.g.
   `dontpad-linux-x64`) over building from source — it needs no Node.js at runtime. Building
   locally (`cd cli && npm install && npm run build`) is the fallback for platforms without a
   published binary or for development work on the CLI itself.
3. **Verify it works:**
   ```bash
   dontpad --version
   ```
4. **Ensure it is configured** (required for read/write commands):
   ```bash
   dontpad config set --base-url https://dontpad.example.com
   ```
5. **Know how the binary was installed** — it changes how updates work:
   - **Standalone binary** (downloaded from a release, e.g. into `~/.local/bin`): use
     `dontpad cli update` to self-update in place.
   - **npm install / `npm link`**: `dontpad cli update` refuses to touch an npm installation.
     Use `npm update -g dontpad-cli` instead.

### Step 2 — Identify the task

| If the user asks to… | Use this command |
|---|---|
| Read a document (stdout) | `dontpad get <path-or-url>` |
| Read and save to a file | `dontpad get <path-or-url> --output ./doc.md --no-print` |
| Read a locked public document | `dontpad get <path-or-url> --password <pw>` |
| Create a new document | `dontpad create <path> --content '# Title\n'` |
| Update from stdin | `printf '# New\n' \| dontpad update <path> --stdin` |
| Update from a local file | `dontpad update <path> --file ./doc.md` |
| Update from inline content | `dontpad update <path> --content '# New\n'` |
| Show config | `dontpad config show` |
| Show config file path | `dontpad config path` |
| Check for a CLI update | `dontpad cli update --check-only` |
| Update the standalone binary | `dontpad cli update --yes` |
| Install the skill | `dontpad skill install` |
| Update the skill | `dontpad skill update` |
| Skill status | `dontpad skill status` |
| Remove the skill | `dontpad skill uninstall` |

### Step 3 — Construct and execute

1. Build the command from the table above.
2. Execute via the Bash tool:
   ```bash
   dontpad <command> [args] [options]
   ```
3. **Common options:**
   - `--base-url <url>` — override the configured HTTP base URL for one command
   - `--ws-base-url <url>` — override the configured/derived WebSocket base URL for one command
     (only `update` and `create`, which write through Yjs/WebSocket sync)
   - `--master-password <pw>` — override the configured master password for one command
   - `--output <file>` — write Markdown to a file (`get` only)
   - `--no-print` — skip stdout when `--output` is used (`get` only)
   - `--json` — machine-readable output (`skill` subcommands only)

### Step 4 — Handle errors

| Error | What to do |
|---|---|
| `command not found: dontpad` | CLI not installed. Download the standalone binary from the `cli-v*` release, or build it from source. |
| `CLI is not configured yet` | Run `dontpad config set --base-url <url>` first. |
| `error: unknown command` | Check spelling. Run `dontpad --help` for available commands. |
| WebSocket / sync errors | The backend may be down or `wsBaseUrl` may be wrong. Verify with `dontpad config show`. |
| `Checksum verification failed` (skill or binary) | The downloaded artifact is corrupted. Retry `dontpad skill update` or `dontpad cli update`. |
| `No dontpad CLI release tagged cli-v*` | No CLI release published yet. Build the skill or CLI locally instead. |
| `dontpad cli update` does nothing on an npm install | Expected — npm installations are never replaced by `cli update`. Use `npm update -g dontpad-cli`. |
| `dontpad cli update` unsupported on Windows | Expected — a running `.exe` cannot be atomically replaced; download the new release manually instead. |
| Network errors | Check internet connection; set `GITHUB_TOKEN` if the GitHub API is rate limited. |

## Command Reference

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
