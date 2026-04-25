import { Command } from 'commander'

export function withStructuredHelp(command: Command, extraText: string): Command {
  const baseFormatter = command.createHelp().formatHelp.bind(command.createHelp())

  command.configureHelp({
    formatHelp: (cmd, helper) => {
      const defaultHelp = baseFormatter(cmd, helper).replace(/\s+$/, '')
      return `${defaultHelp}\n\n${extraText.trim()}\n`
    },
  })

  return command
}