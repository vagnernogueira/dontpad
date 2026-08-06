---
name: dontpad-cli
description: >
  Dontpad CLI skill for a self-hosted Dontpad instance — reading, exporting, creating, or
  updating Markdown documents over the CLI's HTTP and Yjs/WebSocket flows, and installing,
  configuring, updating, or troubleshooting the `dontpad` binary or the `dontpad-cli` Claude Code
  skill itself. Trigger even when the user only says "dontpad" without naming a subcommand.
---

# dontpad-cli — Dontpad Document CLI

CLI tool for a [self-hosted Dontpad](https://github.com/vagnernogueira/dontpad) instance. Reads,
exports, creates, and updates Markdown documents using the same HTTP and Yjs/WebSocket sync the
web editor uses — no browser needed. Also manages its own binary updates and its own Claude Code
skill installation, both sourced from GitHub Releases.

## When NOT to use — redirect to other skills

| If the user asks about… | Redirect to |
|---|---|
| **The Dontpad backend/frontend codebase** (not document operations) | Work directly in the repo; this skill only drives the CLI |
| **Generic Markdown editing** with no Dontpad instance involved | A plain editor or filesystem skill |
| **DeFi / AAVE / DefiLlama data** | `aave-cli` or `llama-cli` skills |

> **Redirect template:** "The `dontpad-cli` only operates on Dontpad documents and the `dontpad`
> binary/skill itself. That request is outside its scope."

## Workflow

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

Full syntax, flags, and behavior for every subcommand (`get`, `update`, `create`, `config`,
`cli update`, `skill`): see [`reference.md`](./reference.md).
