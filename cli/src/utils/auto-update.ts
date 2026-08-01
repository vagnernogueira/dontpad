import { fetchLatestCliRelease } from '../api/update'
import { readConfig } from '../config'
import { VERSION } from '../version'
import { compareVersions, getPlatformAssetName } from './update'
import { loadUpdateCache, saveUpdateCache, shouldCheckUpdate } from './update-cache'

export interface BackgroundUpdateCheckDeps {
    readConfig?: typeof readConfig
    loadCache?: typeof loadUpdateCache
    saveCache?: typeof saveUpdateCache
    fetchRelease?: typeof fetchLatestCliRelease
    currentVersion?: string
    now?: () => number
    writeInfo?: (message: string) => void
}

/**
 * Best-effort entrypoint check. It intentionally absorbs every failure: a
 * missing config directory, unsupported platform, offline network, malformed
 * cache, or GitHub rate limit must never affect the user's requested command.
 */
export async function runBackgroundUpdateCheck(
    dependencies: BackgroundUpdateCheckDeps = {}
): Promise<void> {
    const getConfig = dependencies.readConfig ?? readConfig
    const getCache = dependencies.loadCache ?? loadUpdateCache
    const persistCache = dependencies.saveCache ?? saveUpdateCache
    const getRelease = dependencies.fetchRelease ?? fetchLatestCliRelease
    const now = dependencies.now ?? Date.now
    const currentVersion = dependencies.currentVersion ?? VERSION
    const writeInfo = dependencies.writeInfo ?? ((message: string) => process.stderr.write(message))

    try {
        const config = await getConfig()
        if (!config?.autoUpdateEnabled) {
            return
        }

        const cache = await getCache()
        const currentTime = now()
        if (!shouldCheckUpdate(cache, config.autoUpdateInterval, currentTime)) {
            return
        }

        // Resolving early prevents any network request on a platform that cannot
        // consume one of our published binary assets.
        getPlatformAssetName()
        const release = await getRelease()

        await persistCache({
            version: 1,
            lastCheck: new Date(currentTime).toISOString(),
            latestVersion: release.latestVersion,
            latestReleaseUrl: release.releaseUrl,
        })

        if (compareVersions(release.latestVersion, currentVersion) === 1) {
            writeInfo(
                `Info: Dontpad CLI v${release.latestVersion} is available. ` +
                    "Run 'dontpad cli update' to upgrade.\n"
            )
        }
    } catch {
        // Deliberately silent. This process owns the requested CLI command, not
        // update telemetry; the explicit command surfaces actionable errors.
    }
}
