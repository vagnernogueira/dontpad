import { Command } from 'commander'
import { createInterface } from 'node:readline'

import { fetchLatestCliRelease } from '../api/update'
import { withStructuredHelp } from '../help'
import { installVerifiedBinary } from '../utils/installer'
import { assertSafeSelfUpdateRuntime, compareVersions, getPlatformAssetName } from '../utils/update'
import { VERSION } from '../version'

interface CliUpdateOptions {
    checkOnly?: boolean
    force?: boolean
    yes?: boolean
}

async function requestConfirmation(version: string): Promise<boolean> {
    if (!process.stdin.isTTY || !process.stderr.isTTY) {
        throw new Error('Refusing a non-interactive self-update without --yes.')
    }

    const readline = createInterface({ input: process.stdin, output: process.stderr })

    try {
        const answer = await new Promise<string>((resolve) => {
            readline.question(`Download and install Dontpad CLI v${version}? [y/N] `, resolve)
        })

        return /^(y|yes)$/i.test(answer.trim())
    } finally {
        readline.close()
    }
}

async function runCliUpdate(options: CliUpdateOptions): Promise<void> {
    const platformAssetName = getPlatformAssetName()
    const release = await fetchLatestCliRelease()
    const comparison = compareVersions(release.latestVersion, VERSION)

    process.stderr.write(`Current version: v${VERSION}\n`)
    process.stderr.write(`Latest version:  v${release.latestVersion}\n`)
    process.stderr.write(`Platform asset:  ${release.binaryAssetName} (${platformAssetName})\n`)
    process.stderr.write(`Release page:   ${release.releaseUrl}\n`)

    if (options.checkOnly) {
        process.stderr.write(
            comparison === 1
                ? "\nA new version is available. Run 'dontpad cli update' to upgrade.\n"
                : comparison === 0
                  ? '\nDontpad CLI is up to date.\n'
                  : '\nThis local CLI is newer than the latest published stable release.\n'
        )
        return
    }

    if (comparison === -1) {
        throw new Error(
            'The installed CLI is newer than the latest official stable release. Refusing to downgrade automatically.'
        )
    }

    if (comparison === 0 && !options.force) {
        process.stderr.write(
            '\nDontpad CLI is already up to date. Use --force to re-download this version.\n'
        )
        return
    }

    assertSafeSelfUpdateRuntime()

    if (!options.yes && !(await requestConfirmation(release.latestVersion))) {
        process.stderr.write('Update cancelled.\n')
        return
    }

    process.stderr.write(`Downloading and verifying Dontpad CLI v${release.latestVersion}...\n`)
    const installed = await installVerifiedBinary({ binaryPath: process.execPath, release })

    process.stderr.write(`Updated Dontpad CLI to v${installed.version}.\n`)
    process.stderr.write(`Binary: ${installed.binaryPath}\n`)
    process.stderr.write(`Backup: ${installed.backupPath}\n`)
}

export function buildCliCommand(): Command {
    const cli = new Command('cli').description('Manage the standalone Dontpad CLI binary.')

    cli.command('update')
        .description('Check for a published CLI release and securely update the standalone binary.')
        .option(
            '--check-only',
            'Check the latest release without downloading or replacing the binary.'
        )
        .option(
            '--force',
            'Re-download the current published version when it is already installed.'
        )
        .option('--yes', 'Confirm the replacement without prompting.')
        .action(runCliUpdate)

    return withStructuredHelp(
        cli,
        `
Examples:
  dontpad cli update --check-only
  dontpad cli update
  dontpad cli update --force --yes

Safety:
  Only stable cli-vX.Y.Z releases and official Dontpad GitHub release assets are accepted.
  The binary SHA-256 is required and verified before its atomic replacement.
  The previous binary is retained as <binary>.bak and restored if final verification fails.
  npm installations are not replaced; use npm update -g dontpad-cli instead.
  Automatic replacement is intentionally disabled on Windows because a running .exe is locked.
`
    )
}
