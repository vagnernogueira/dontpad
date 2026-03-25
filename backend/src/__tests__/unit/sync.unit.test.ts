import { beforeEach, describe, expect, it } from 'vitest';
import {
    __resetTestState,
    __setTestStoragePaths,
    equalsHash,
    hashPassword,
    normalizeDocName,
    removeDocumentPassword,
    setDocumentPassword,
    verifyDocumentAccess,
    verifyDocumentPassword,
    verifyDocumentsMasterPassword
} from '../../sync';
import fs from 'fs';
import os from 'os';
import path from 'path';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dontpad-sync-test-'));

describe('sync unit', () => {
    beforeEach(() => {
        __setTestStoragePaths({
            lockFilePath: path.join(tempDir, `locks-${Date.now()}.json`),
            metadataFilePath: path.join(tempDir, `meta-${Date.now()}.json`)
        });
        __resetTestState();
    });

    it('normalizes encoded path segments', () => {
        expect(normalizeDocName('folder%20a/doc%2Fname')).toBe('folder a/doc/name');
    });

    it('hashes deterministically and compares safely', () => {
        const first = hashPassword('secret', 'salt');
        const second = hashPassword('secret', 'salt');
        const different = hashPassword('other', 'salt');

        expect(first).toBe(second);
        expect(equalsHash(first, second)).toBe(true);
        expect(equalsHash(first, different)).toBe(false);
    });

    it('verifies document access through stored password', () => {
        setDocumentPassword('private-doc', '123456');

        expect(verifyDocumentPassword('private-doc', '123456')).toBe(true);
        expect(verifyDocumentAccess('private-doc', '123456')).toBe(true);
        expect(verifyDocumentAccess('private-doc', 'wrong')).toBe(false);

        removeDocumentPassword('private-doc');
        expect(verifyDocumentAccess('private-doc', '')).toBe(true);
    });

    it('accepts any master password when none is configured', () => {
        expect(verifyDocumentsMasterPassword('')).toBe(true);
        expect(verifyDocumentsMasterPassword('whatever')).toBe(true);
    });
});