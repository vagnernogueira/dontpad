---
name: dontpad-cli
description: >
  Use this skill for any request involving Dontpad Markdown documents —
  reading, exporting, creating, or updating documents via the existing HTTP
  and Yjs/WebSocket flows of a self-hosted Dontpad instance. Trigger this
  skill whenever the user asks to fetch, write, or create a Dontpad document
  from the terminal, configure the Dontpad CLI, or manage the dontpad-cli
  Claude Code skill installation.
---

# dontpad-cli — Dontpad Document CLI

CLI tool for a [self-hosted Dontpad](https://github.com/vagnernogueira/dontpad) instance. Reads,
exports, creates, and updates Markdown documents using the same HTTP and Yjs/WebSocket sync the
web editor uses — no browser needed.

## When to use

Trigger this skill when the user's request matches **any** of the following:

### Reading / exporting documents

- Read a document by path or full URL (e.g. "get me/todo from dontpad")
- Export a document's raw Markdown to a local file
- Read a locked document through the public endpoint with `--password`
- Fetch the `?raw`, `?view`, or `?pdf` content of a document

### Creating / updating documents

- Create a new document from inline content (e.g. "create drafts/note with this text")
- Update an existing document's content from stdin or `--content` (uses Yjs/WebSocket sync)
- Append or replace Markdown on a Dontpad URL

### Configuration

- Inspect or set the persisted CLI config (`baseUrl`, `wsBaseUrl`, `masterPassword`)
- Resolve the config file path (`dontpad config path`)

### Skill self-management

- Install / update / inspect / remove the dontpad-cli Claude Code skill from a GitHub release
- Check whether the installed skill matches the latest `cli-v*` release

## When NOT to use — redirect to other skills

| If the user asks about… | Redirect to |
|---|---|
| **The Dontpad backend/frontend codebase** (not document operations) | Work directly in the repo; this skill only drives the CLI |
| **Generic Markdown editing** with no Dontpad instance involved | A plain editor or filesystem skill |
| **DeFi / AAVE / DefiLlama data** | `aave-cli` or `llama-cli` skills |

> **Redirect template:** "The `dontpad-cli` only operates on Dontpad documents via the CLI. That request is outside its scope."

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
2. **If not installed**, build locally (`cd cli && npm install && npm run build`) or download the
   standalone binary from https://github.com/vagnernogueira/dontpad/releases (look for `cli-v*` tags).
3. **Verify it works:**
   ```bash
   dontpad --version
   ```
4. **Ensure it is configured** (required for read/write commands):
   ```bash
   dontpad config set --base-url https://dontpad.example.com
   ```

### Step 2 — Identify the task

| If the user asks to… | Use this command |
|---|---|
| Read a document (stdout) | `dontpad get <path-or-url>` |
| Read and save to a file | `dontpad get <path-or-url> --output ./doc.md --no-print` |
| Read a locked public document | `dontpad get <path-or-url> --password <pw>` |
| Create a new document | `dontpad create <path> --content '# Title\n'` |
| Update from stdin | `printf '# New\n' \| dontpad update <path> --stdin` |
| Update from inline content | `dontpad update <path> --content '# New\n'` |
| Show config | `dontpad config show` |
| Show config file path | `dontpad config path` |
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
   - `--master-password <pw>` — override the configured master password for one command
   - `--output <file>` — write Markdown to a file (read commands)
   - `--no-print` — skip stdout when `--output` is used
   - `--json` — machine-readable output (skill subcommands)

### Step 4 — Handle errors

| Error | What to do |
|---|---|
| `command not found: dontpad` | CLI not installed. Build it or download from the `cli-v*` release. |
| `CLI is not configured yet` | Run `dontpad config set --base-url <url>` first. |
| `error: unknown command` | Check spelling. Run `dontpad --help` for available commands. |
| WebSocket / sync errors | The backend may be down or `wsBaseUrl` may be wrong. Verify with `dontpad config show`. |
| `Checksum verification failed` (skill) | The downloaded artifact is corrupted. Retry `dontpad skill update`. |
| `No dontpad CLI release tagged cli-v*` (skill) | No CLI release published yet. Build the skill locally instead. |
| Network errors | Check internet connection; set `GITHUB_TOKEN` if the GitHub API is rate limited. |

## Command Reference

### `dontpad get`

Read a Dontpad document by path or full URL; print or export the raw Markdown.

```bash
dontpad get <document> [--base-url <url>] [--master-password <pw>] [--password <pw>] [--output <file>] [--no-print]
```

### `dontpad update`

Update a Dontpad document's content using the Yjs/WebSocket sync flow.

```bash
dontpad update <document> [--stdin | --content <text>] [--base-url <url>] [--master-password <pw>] [--password <pw>]
```

### `dontpad create`

Create a new Dontpad document with inline or stdin content.

```bash
dontpad create <document> [--stdin | --content <text>] [--base-url <url>] [--master-password <pw>]
```

### `dontpad config`

Inspect or update the persisted CLI configuration.

```bash
dontpad config set --base-url <url> [--ws-base-url <url>] [--master-password <pw>]
dontpad config show [--reveal-master-password]
dontpad config path
```

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
`~/.claude/skills/dontpad-cli`). Metadata is persisted at `~/.config/dontpad/skill.json`.
