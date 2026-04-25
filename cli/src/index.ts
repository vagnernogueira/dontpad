#!/usr/bin/env node

import { buildCli } from './cli'

async function main(): Promise<void> {
  await buildCli().parseAsync(process.argv)
}

main().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : 'Unexpected CLI failure.'

  process.stderr.write(`Error: ${errorMessage}\n`)
  process.exitCode = 1
})