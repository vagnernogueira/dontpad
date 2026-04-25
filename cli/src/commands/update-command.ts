import { Command } from 'commander'

import { resolveRequiredContentInput } from '../content-source'
import {
  readCurrentDocumentContent,
  resolveDocumentCommandContext,
} from '../command-context'
import { withStructuredHelp } from '../help'
import { syncDocumentContent } from '../document-sync'

interface UpdateCommandOptions {
  baseUrl?: string
  wsBaseUrl?: string
  masterPassword?: string
  password?: string
  content?: string
  file?: string
  stdin?: boolean
}

export function buildUpdateCommand(): Command {
  return withStructuredHelp(
    new Command('update')
    .description('Replace the Markdown content of an existing document using the same Yjs WebSocket sync path as the editor.')
    .argument('<document>', 'Document path like me/todo or a full Dontpad document URL.')
    .option('--base-url <url>', 'Override the configured HTTP base URL for this command.')
    .option('--ws-base-url <url>', 'Override the configured or derived WebSocket base URL for this command.')
    .option('--master-password <password>', 'Override the configured master password for this command.')
    .option('--password <password>', 'Password for a locked document.')
    .option('--content <markdown>', 'Use this literal Markdown as the new document content.')
    .option('--file <path>', 'Load the new Markdown from a local file.')
    .option('--stdin', 'Read the new Markdown from stdin.')
    .action(async (document: string, options: UpdateCommandOptions) => {
      const contentInput = await resolveRequiredContentInput(options)
      const context = await resolveDocumentCommandContext(document, options)
      const currentContent = await readCurrentDocumentContent(context)

      if (currentContent === contentInput.content) {
        process.stderr.write(`No update needed for ${context.documentId}; content is already current.\n`)
        return
      }

      await syncDocumentContent({
        wsBaseUrl: context.wsBaseUrl,
        documentId: context.documentId,
        content: contentInput.content,
        password: context.password,
        readBack: async () => await readCurrentDocumentContent(context),
      })

      process.stderr.write(
        `Updated ${context.documentId} from ${contentInput.source} using Yjs WebSocket sync at ${context.wsBaseUrl}.\n`,
      )
    }),
    `
Examples:
  dontpad update me/todo --file ./todo.md
  printf '# From stdin\n' | dontpad update me/todo --stdin
  dontpad update https://docs.example.com/secret/doc --password 1234 --content '# Updated\n'

Notes:
  This command reads the current document over HTTP for verification and writes the new state through Yjs WebSocket sync.
  If the content is unchanged, the command exits without opening a write session.
`,
  )
}