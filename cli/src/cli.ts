import { Command } from 'commander'

import { buildCliCommand } from './commands/cli-command'
import { buildConfigCommand } from './commands/config-command'
import { buildCreateCommand } from './commands/create-command'
import { buildGetCommand } from './commands/get-command'
import { buildSkillCommand } from './commands/skill-command'
import { buildUpdateCommand } from './commands/update-command'
import { withStructuredHelp } from './help'
import { VERSION } from './version'

export function buildCli(): Command {
  return withStructuredHelp(
    new Command()
    .name('dontpad')
    .description('Read, export, update, and create Dontpad Markdown documents using the existing HTTP and Yjs/WebSocket flows.')
    .version(VERSION)
    .showHelpAfterError()
    .addCommand(buildConfigCommand())
    .addCommand(buildCliCommand())
    .addCommand(buildGetCommand())
    .addCommand(buildUpdateCommand())
    .addCommand(buildCreateCommand())
    .addCommand(buildSkillCommand()),
    `
Examples:
  dontpad config set --base-url http://localhost:1234
  dontpad get me/todo
  dontpad get https://docs.example.com/me/todo --output ./todo.md --no-print
  printf '# Updated from CLI\n' | dontpad update me/todo --stdin
  dontpad create drafts/new-note --content '# Draft\n'
  dontpad cli update --check-only

Operational notes:
  Path arguments use the configured baseUrl.
  Full document URLs can override the configured host automatically.
  Read commands reuse /api/document-content or /api/public-document-content.
  Write commands reuse the existing Yjs WebSocket sync used by the editor.
`,
  )
}