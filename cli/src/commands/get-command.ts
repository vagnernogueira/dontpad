import { Command } from 'commander'

import { readDocumentContent } from '../document-api'
import { resolveDocumentCommandContext, writeMarkdownFile } from '../command-context'
import { withStructuredHelp } from '../help'

interface GetCommandOptions {
  baseUrl?: string
  masterPassword?: string
  password?: string
  output?: string
  print?: boolean
}

export function buildGetCommand(): Command {
  return withStructuredHelp(
    new Command('get')
    .description('Read a Dontpad document by path or full URL and print or export the raw Markdown.')
    .argument('<document>', 'Document path like me/todo or a full Dontpad document URL.')
    .option('--base-url <url>', 'Override the configured HTTP base URL for this command.')
    .option('--master-password <password>', 'Override the configured master password for this command.')
    .option('--password <password>', 'Password for a locked document when reading through the public endpoint.')
    .option('--output <file>', 'Write the Markdown to a local file. The content still goes to stdout unless --no-print is used.')
    .option('--no-print', 'Skip stdout and only persist the Markdown to --output.')
    .action(async (document: string, options: GetCommandOptions) => {
      const context = await resolveDocumentCommandContext(document, options)
      const result = await readDocumentContent({
        baseUrl: context.baseUrl,
        documentId: context.documentId,
        masterPassword: context.masterPassword,
        documentPassword: context.password,
      })

      if (options.output) {
        await writeMarkdownFile(options.output, result.content)
        process.stderr.write(`Saved ${context.documentId} to ${options.output}\n`)
      }

      if (options.print !== false || !options.output) {
        process.stdout.write(result.content)
      }

      process.stderr.write(`Read ${context.documentId} via ${result.route}.\n`)
    }),
    `
Examples:
  dontpad get me/todo
  dontpad get https://docs.example.com/me/todo --output ./todo.md --no-print
  dontpad get secret/doc --password 1234

Notes:
  The command uses GET /api/document-content when a master password is available.
  Otherwise it falls back to GET /api/public-document-content.
`,
  )
}