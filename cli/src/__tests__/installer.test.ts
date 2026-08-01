import { createHash } from 'node:crypto'
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CliReleaseCheck } from '../api/update'
import { installVerifiedBinary, type BinaryInstallerDeps } from '../utils/installer'

const temporaryDirectories: string[] = []

async function temporaryDirectory(): Promise<string> {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'dontpad-binary-install-'))
    temporaryDirectories.push(directory)
    return directory
}

afterEach(async () => {
    await Promise.all(
        temporaryDirectories
            .splice(0)
            .map((directory) => rm(directory, { recursive: true, force: true }))
    )
})

function sha256(content: string): string {
    return createHash('sha256').update(content).digest('hex')
}

function release(): CliReleaseCheck {
    return {
        latestVersion: '0.2.0',
        tag: 'cli-v0.2.0',
        releaseUrl: 'https://github.com/vagnernogueira/dontpad/releases/tag/cli-v0.2.0',
        binaryAssetName: 'dontpad-linux-x64',
        binaryUrl:
            'https://github.com/vagnernogueira/dontpad/releases/download/cli-v0.2.0/dontpad-linux-x64',
        checksumAssetName: 'dontpad-linux-x64.sha256',
        checksumUrl:
            'https://github.com/vagnernogueira/dontpad/releases/download/cli-v0.2.0/dontpad-linux-x64.sha256',
    }
}

function releaseDependencies(content: string): BinaryInstallerDeps {
    return {
        downloadBinary: async (_url, destination) => await writeFile(destination, content, 'utf8'),
        downloadText: async () => `${sha256(content)}  dontpad-linux-x64\n`,
    }
}

describe('verified binary installer', () => {
    it('backs up and atomically replaces a verified executable', async () => {
        const directory = await temporaryDirectory()
        const binaryPath = path.join(directory, 'dontpad')
        await writeFile(binaryPath, 'old executable', 'utf8')
        await chmod(binaryPath, 0o755)

        const result = await installVerifiedBinary(
            { binaryPath, release: release() },
            releaseDependencies('new executable')
        )

        expect(result.backupPath).toBe(`${binaryPath}.bak`)
        await expect(readFile(binaryPath, 'utf8')).resolves.toBe('new executable')
        await expect(readFile(`${binaryPath}.bak`, 'utf8')).resolves.toBe('old executable')
    })

    it('refuses a mismatched SHA-256 before touching the existing binary', async () => {
        const directory = await temporaryDirectory()
        const binaryPath = path.join(directory, 'dontpad')
        await writeFile(binaryPath, 'old executable', 'utf8')
        await chmod(binaryPath, 0o755)
        const dependencies: BinaryInstallerDeps = {
            ...releaseDependencies('tampered executable'),
            downloadText: async () => `${'0'.repeat(64)}  dontpad-linux-x64\n`,
        }

        await expect(
            installVerifiedBinary({ binaryPath, release: release() }, dependencies)
        ).rejects.toThrow('SHA-256 verification failed')
        await expect(readFile(binaryPath, 'utf8')).resolves.toBe('old executable')
        await expect(readFile(`${binaryPath}.bak`, 'utf8')).rejects.toMatchObject({
            code: 'ENOENT',
        })
    })

    it('rolls back from the named backup when final verification fails', async () => {
        const directory = await temporaryDirectory()
        const binaryPath = path.join(directory, 'dontpad')
        await writeFile(binaryPath, 'old executable', 'utf8')
        await chmod(binaryPath, 0o755)
        let verificationCalls = 0

        const dependencies: BinaryInstallerDeps = {
            ...releaseDependencies('new executable'),
            verifyChecksum: async () => {
                verificationCalls += 1
                if (verificationCalls === 2) {
                    throw new Error('simulated final verification failure')
                }
            },
        }

        await expect(
            installVerifiedBinary({ binaryPath, release: release() }, dependencies)
        ).rejects.toThrow('previous binary was restored')
        await expect(readFile(binaryPath, 'utf8')).resolves.toBe('old executable')
        await expect(readFile(`${binaryPath}.bak`, 'utf8')).resolves.toBe('old executable')
    })

    it('refuses a symbolic-link replacement target', async () => {
        const directory = await temporaryDirectory()
        const actualBinary = path.join(directory, 'actual-dontpad')
        const binaryPath = path.join(directory, 'dontpad')
        await writeFile(actualBinary, 'old executable', 'utf8')
        await chmod(actualBinary, 0o755)
        await (await import('node:fs/promises')).symlink(actualBinary, binaryPath)

        await expect(
            installVerifiedBinary(
                { binaryPath, release: release() },
                releaseDependencies('new executable')
            )
        ).rejects.toThrow('symbolic-link target')
        await expect(readFile(actualBinary, 'utf8')).resolves.toBe('old executable')
    })

    it('rejects a mismatched release artifact before invoking download or replacing the target', async () => {
        const directory = await temporaryDirectory()
        const binaryPath = path.join(directory, 'dontpad')
        await writeFile(binaryPath, 'old executable', 'utf8')
        await chmod(binaryPath, 0o755)
        const downloadBinary = vi.fn()
        const downloadText = vi.fn()
        const unsafeRelease = { ...release(), binaryAssetName: '../dontpad' }

        await expect(
            installVerifiedBinary(
                { binaryPath, release: unsafeRelease },
                {
                    downloadBinary,
                    downloadText,
                }
            )
        ).rejects.toThrow('artifacts do not match this platform')

        expect(downloadBinary).not.toHaveBeenCalled()
        expect(downloadText).not.toHaveBeenCalled()
        await expect(readFile(binaryPath, 'utf8')).resolves.toBe('old executable')
    })
})
