import { Command } from 'commander'

import { resolveOptionalContentInput } from '../content-source'
import { readCurrentDocumentContent, resolveDocumentCommandContext } from '../command-context'
import { withStructuredHelp } from '../help'
import { syncDocumentContent } from '../document-sync'

interface CreateCommandOptions {
  baseUrl?: string
  wsBaseUrl?: string
  masterPassword?: string
  password?: string
  content?: string
  file?: string
  stdin?: boolean
}

export function buildCreateCommand(): Command {
  return withStructuredHelp(
    new Command('create')
    .description('Create a new blank document or initialize an empty document with Markdown content.')
    .argument('<document>', 'Document path like drafts/note or a full Dontpad document URL.')
    .option('--base-url <url>', 'Override the configured HTTP base URL for this command.')
    .option('--ws-base-url <url>', 'Override the configured or derived WebSocket base URL for this command.')
    .option('--master-password <password>', 'Override the configured master password for this command.')
    .option('--password <password>', 'Password for a locked document.')
    .option('--content <markdown>', 'Use this literal Markdown as the initial document content.')
    .option('--file <path>', 'Load the initial Markdown from a local file.')
    .option('--stdin', 'Read the initial Markdown from stdin.')
    .action(async (document: string, options: CreateCommandOptions) => {
      const contentInput = await resolveOptionalContentInput(options)
      const context = await resolveDocumentCommandContext(document, options)
      const currentContent = await readCurrentDocumentContent(context)

      if (currentContent.trim().length > 0) {
        throw new Error(
          `Refusing to create ${context.documentId} because it already has content. Use "dontpad update ${context.documentId}" to replace it.`,
        )
      }

      await syncDocumentContent({
        wsBaseUrl: context.wsBaseUrl,
        documentId: context.documentId,
        content: contentInput?.content ?? '',
        password: context.password,
        readBack: async () => await readCurrentDocumentContent(context),
      })

      process.stderr.write(
        contentInput
          ? `Created ${context.documentId} with initial content from ${contentInput.source}.\n`
          : `Created blank document ${context.documentId}.\n`,
      )
    }),
    `
Examples:
  dontpad create drafts/new-note
  dontpad create drafts/new-note --content '# Draft\n'
  cat ./draft.md | dontpad create https://docs.example.com/drafts/new-note --stdin

Notes:
  The command first checks the current document content through HTTP.
  Creation proceeds only when the current content is empty after trim(), matching the backend empty-document convention.
`,
  )
}