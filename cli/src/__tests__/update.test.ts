import { describe, expect, it } from 'vitest'

import {
    assertSafeSelfUpdateRuntime,
    compareVersions,
    getBinaryAssetName,
    getPlatformAssetName,
    UnsafeSelfUpdateError,
    UnsupportedUpdatePlatformError,
} from '../utils/update'

describe('self-update platform and version safety', () => {
    it('maps only published standalone platforms to their asset names', () => {
        expect(getPlatformAssetName({ platform: 'linux', arch: 'x64' })).toBe('linux-x64')
        expect(getPlatformAssetName({ platform: 'darwin', arch: 'arm64' })).toBe('darwin-arm64')
        expect(getPlatformAssetName({ platform: 'win32', arch: 'x64' })).toBe('win-x64')
        expect(getBinaryAssetName({ platform: 'linux', arch: 'x64' })).toBe('dontpad-linux-x64')
    })

    it('rejects platform and architecture combinations with no published binary', () => {
        expect(() => getPlatformAssetName({ platform: 'linux', arch: 'arm64' })).toThrow(
            UnsupportedUpdatePlatformError
        )
    })

    it('compares only stable semantic versions', () => {
        expect(compareVersions('1.2.0', '1.1.9')).toBe(1)
        expect(compareVersions('1.2.0', '1.2.0')).toBe(0)
        expect(compareVersions('1.2.0', '1.2.1')).toBe(-1)
        expect(() => compareVersions('1.2.0-rc.1', '1.2.0')).toThrow('stable semantic version')
    })

    it('refuses npm Node executables and Windows self-replacement explicitly', () => {
        expect(() =>
            assertSafeSelfUpdateRuntime({ platform: 'linux', arch: 'x64' }, '/usr/bin/node')
        ).toThrow(UnsafeSelfUpdateError)
        expect(() =>
            assertSafeSelfUpdateRuntime({ platform: 'win32', arch: 'x64' }, 'C:\\dontpad.exe')
        ).toThrow('disabled on Windows')
    })
})
