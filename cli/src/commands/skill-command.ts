import { Command } from 'commander'

import {
  forceInstallSkill,
  forceUpdateSkill,
  getSkillStatus,
  installSkill,
  uninstallSkill,
  updateSkill,
  type SkillInstallerDeps,
} from '../utils/skill-installer'
import { withStructuredHelp } from '../help'

interface SkillActionOptions {
  target?: string
  force?: boolean
  json?: boolean
}

function writeJson(payload: unknown): void {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`)
}

function fail(error: string, json?: boolean): void {
  if (json) {
    writeJson({ success: false, error })
  } else {
    process.stderr.write(`Error: ${error}\n`)
  }
  process.exitCode = 1
}

export function buildSkillCommand(deps?: SkillInstallerDeps): Command {
  const skill = new Command('skill').description(
    'Manage the dontpad-cli Claude Code skill installation from GitHub releases.',
  )

  skill
    .command('install')
    .description('Download the skill artifact from the latest CLI release and install it.')
    .option('--target <path>', 'Absolute target installation directory (defaults to ~/.claude/skills/dontpad-cli).')
    .option('--force', 'Remove an existing installation before installing.')
    .option('--json', 'Emit machine-readable JSON instead of human text.')
    .action(async (options: SkillActionOptions) => {
      const result = options.force
        ? await forceInstallSkill(options.target, deps)
        : await installSkill(options.target, deps)

      if (options.json) {
        writeJson(result)
        if (!result.success) {
          process.exitCode = 1
        }
        return
      }

      if (!result.success) {
        fail(result.error ?? 'Unknown error')
        return
      }

      process.stdout.write(
        `Skill ${result.releaseVersion ? `v${result.releaseVersion} ` : ''}installed to ${result.target}\n`,
      )
      process.stdout.write(
        `Release: ${result.releaseUrl ?? '(unknown)'}\n`,
      )
    })

  skill
    .command('update')
    .description('Re-download the skill artifact from the latest CLI release and replace the local install.')
    .option('--target <path>', 'Absolute target installation directory.')
    .option('--force', 'Force reinstall even when the target is missing.')
    .option('--json', 'Emit machine-readable JSON instead of human text.')
    .action(async (options: SkillActionOptions) => {
      const result = options.force
        ? await forceUpdateSkill(options.target, deps)
        : await updateSkill(options.target, deps)

      if (options.json) {
        writeJson(result)
        if (!result.success) {
          process.exitCode = 1
        }
        return
      }

      if (!result.success) {
        fail(result.error ?? 'Unknown error')
        return
      }

      process.stdout.write(
        `Skill updated to ${result.releaseVersion ? `v${result.releaseVersion} ` : ''}${result.target}\n`,
      )
    })

  skill
    .command('status')
    .description('Report whether the skill is installed and whether it matches the latest release.')
    .option('--target <path>', 'Absolute target installation directory.')
    .option('--json', 'Emit machine-readable JSON instead of human text.')
    .action(async (options: SkillActionOptions) => {
      const status = await getSkillStatus(options.target, deps)

      if (options.json) {
        writeJson(status)
        return
      }

      if (!status.installed) {
        process.stdout.write(`Skill is not installed (expected at ${status.target}).\n`)
        process.stdout.write('Run `dontpad skill install` to install it.\n')
        return
      }

      process.stdout.write(`Skill is installed at ${status.target}\n`)
      process.stdout.write(`Installed release: ${status.releaseVersion ?? 'unknown'}\n`)

      if (status.upToDate === null) {
        process.stdout.write('Latest release: unreachable (offline). Cannot determine up-to-date status.\n')
      } else if (status.upToDate) {
        process.stdout.write(`Status: up to date (latest ${status.latestVersion ?? '?'}). \n`)
      } else {
        process.stdout.write(
          `Status: outdated (installed ${status.releaseVersion ?? '?'}, latest ${status.latestVersion ?? '?'}). Run \`dontpad skill update\`.\n`,
        )
      }
    })

  skill
    .command('uninstall')
    .description('Remove the installed skill and clear its metadata.')
    .option('--target <path>', 'Absolute target installation directory.')
    .option('--force', 'Force removal (same default behavior; accepted for symmetry with install/update).')
    .option('--json', 'Emit machine-readable JSON instead of human text.')
    .action((options: SkillActionOptions) => {
      const result = uninstallSkill(options.target, deps)

      if (options.json) {
        writeJson(result)
        if (!result.success) {
          process.exitCode = 1
        }
        return
      }

      if (!result.success) {
        fail(result.error ?? 'Unknown error')
        return
      }

      process.stdout.write(`Skill uninstalled from ${result.target}\n`)
    })

  return withStructuredHelp(
    skill,
    `
Examples:
  dontpad skill install
  dontpad skill install --target /opt/agents/dontpad-cli --force
  dontpad skill update
  dontpad skill status --json
  dontpad skill uninstall

Notes:
  The skill artifact (skills.tar.gz) is downloaded from the latest GitHub
  release tagged cli-v*, checksum-verified, extracted and atomically swapped
  into the target directory. Metadata is persisted at ~/.config/dontpad/skill.json.
`,
  )
}
