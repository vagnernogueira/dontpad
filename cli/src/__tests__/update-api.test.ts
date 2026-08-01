import { describe, expect, it, vi } from 'vitest'

import { fetchLatestCliRelease, UpdateRateLimitedError, UpdateReleaseError } from '../api/update'

const linux = { platform: 'linux' as const, arch: 'x64' }

function asset(name: string): { name: string } {
    return { name }
}

function release(
    tag: string,
    assets: { name: string }[],
    options: { draft?: boolean; prerelease?: boolean } = {}
): Record<string, unknown> {
    return { tag_name: tag, assets, ...options }
}

function fetchResponse(body: unknown, status = 200): typeof globalThis.fetch {
    return vi.fn(
        async () =>
            new Response(typeof body === 'string' ? body : JSON.stringify(body), {
                status,
                statusText: status === 429 ? 'Too Many Requests' : '',
                headers: { 'content-type': 'application/json' },
            })
    ) as unknown as typeof globalThis.fetch
}

describe('GitHub CLI release checks', () => {
    it('selects the highest published stable cli-v tag rather than app tags or list order', async () => {
        const fetch = fetchResponse([
            release('v9.0.0', [asset('app-linux-x64')]),
            release('cli-v0.9.0', [asset('dontpad-linux-x64'), asset('dontpad-linux-x64.sha256')]),
            release(
                'cli-v1.0.0-rc.1',
                [asset('dontpad-linux-x64'), asset('dontpad-linux-x64.sha256')],
                {
                    prerelease: true,
                }
            ),
            release('cli-v1.0.0', [asset('dontpad-linux-x64'), asset('dontpad-linux-x64.sha256')]),
            release('cli-v1.2.0', [asset('dontpad-linux-x64'), asset('dontpad-linux-x64.sha256')], {
                draft: true,
            }),
        ])

        const result = await fetchLatestCliRelease(linux, { fetch })

        expect(result).toMatchObject({
            tag: 'cli-v1.0.0',
            latestVersion: '1.0.0',
            binaryAssetName: 'dontpad-linux-x64',
            checksumAssetName: 'dontpad-linux-x64.sha256',
        })
        expect(result.binaryUrl).toBe(
            'https://github.com/vagnernogueira/dontpad/releases/download/cli-v1.0.0/dontpad-linux-x64'
        )
        expect(result.checksumUrl).toBe(
            'https://github.com/vagnernogueira/dontpad/releases/download/cli-v1.0.0/dontpad-linux-x64.sha256'
        )
    })

    it('uses the scoped Releases endpoint and sends an optional token only to the API', async () => {
        const fetch = fetchResponse([
            release('cli-v0.2.0', [asset('dontpad-linux-x64'), asset('dontpad-linux-x64.sha256')]),
        ])

        await fetchLatestCliRelease(linux, { fetch, token: 'test-token' })

        expect(fetch).toHaveBeenCalledOnce()
        const [url, init] = vi.mocked(fetch).mock.calls[0]
        expect(String(url)).toBe(
            'https://api.github.com/repos/vagnernogueira/dontpad/releases?per_page=100'
        )
        expect(init?.headers).toMatchObject({
            Accept: 'application/vnd.github+json',
            Authorization: 'Bearer test-token',
            'X-GitHub-Api-Version': '2022-11-28',
        })
    })

    it('requires both the exact platform binary and its SHA-256 release asset', async () => {
        const fetch = fetchResponse([release('cli-v0.2.0', [asset('dontpad-linux-x64')])])

        await expect(fetchLatestCliRelease(linux, { fetch })).rejects.toThrow(
            'mandatory SHA-256 asset dontpad-linux-x64.sha256'
        )
    })

    it('rejects malformed cli tags instead of treating arbitrary cli-v* tags as release versions', async () => {
        const fetch = fetchResponse([
            release('cli-vnot-semver', [
                asset('dontpad-linux-x64'),
                asset('dontpad-linux-x64.sha256'),
            ]),
            release('cli-v1.0', [asset('dontpad-linux-x64'), asset('dontpad-linux-x64.sha256')]),
        ])

        await expect(fetchLatestCliRelease(linux, { fetch })).rejects.toBeInstanceOf(
            UpdateReleaseError
        )
    })

    it('maps GitHub rate limiting to an actionable error', async () => {
        const fetch = fetchResponse({ message: 'rate limited' }, 429)

        await expect(fetchLatestCliRelease(linux, { fetch })).rejects.toBeInstanceOf(
            UpdateRateLimitedError
        )
    })
})
