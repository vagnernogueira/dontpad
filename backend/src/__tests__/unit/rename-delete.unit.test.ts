import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';
import {
    __clearTestPersistence,
    __resetTestState,
    __setTestStoragePaths,
    __setTestPersistence,
    renameDocument,
    deleteDocument,
    listDocumentNames
} from '../../sync';
import fs from 'fs';
import os from 'os';
import path from 'path';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dontpad-rename-delete-test-'));

const createMockPersistence = (initialDocs: string[] = []) => {
    const docs = new Map<string, Uint8Array>();
    initialDocs.forEach(name => docs.set(name, new Uint8Array()));

    return {
        docs,
        getAllDocNames: vi.fn().mockResolvedValue([...docs.keys()]),
        getYDoc: vi.fn().mockImplementation(async (_docName: string) => {
            return new Y.Doc();
        }),
        storeUpdate: vi.fn().mockImplementation(async (docName: string, update: Uint8Array) => {
            docs.set(docName, update);
        }),
        clearDocument: vi.fn().mockImplementation(async (docName: string) => {
            docs.delete(docName);
        }),
        getDocNames: vi.fn().mockImplementation(() => [...docs.keys()])
    };
};

describe('renameDocument', () => {
    let mockPersistence: ReturnType<typeof createMockPersistence>;

    beforeEach(() => {
        __setTestStoragePaths({
            lockFilePath: path.join(tempDir, `locks-${Date.now()}.json`),
            metadataFilePath: path.join(tempDir, `meta-${Date.now()}.json`)
        });
        __resetTestState();
        __clearTestPersistence();

        mockPersistence = createMockPersistence(['source-doc']);
        __setTestPersistence(mockPersistence);
    });

    it('returns error when source document is empty', async () => {
        const result = await renameDocument('', 'target-doc');

        expect(result).toEqual({ ok: false, error: 'source_document_required' });
    });

    it('returns error when target document is empty', async () => {
        const result = await renameDocument('source-doc', '');

        expect(result).toEqual({ ok: false, error: 'target_document_required' });
    });

    it('returns error when source and target are the same', async () => {
        const result = await renameDocument('same-doc', 'same-doc');

        expect(result).toEqual({ ok: false, error: 'same_document_name' });
    });

    it('returns error when source document does not exist', async () => {
        mockPersistence.getAllDocNames = vi.fn().mockResolvedValue(['other-doc']);

        const result = await renameDocument('nonexistent', 'target-doc');

        expect(result).toEqual({ ok: false, error: 'source_document_not_found' });
    });

    it('returns error when target document already exists', async () => {
        mockPersistence.getAllDocNames = vi.fn().mockResolvedValue(['source-doc', 'target-doc']);

        const result = await renameDocument('source-doc', 'target-doc');

        expect(result).toEqual({ ok: false, error: 'target_document_already_exists' });
    });

    it('successfully renames document and moves Yjs state', async () => {
        mockPersistence.getAllDocNames = vi.fn().mockResolvedValue(['source-doc']);

        const result = await renameDocument('source-doc', 'target-doc');

        expect(result).toEqual({ ok: true });
        expect(mockPersistence.storeUpdate).toHaveBeenCalledWith('target-doc', expect.any(Uint8Array));
        expect(mockPersistence.clearDocument).toHaveBeenCalledWith('source-doc');
    });

    it('normalizes document names before renaming', async () => {
        mockPersistence.getAllDocNames = vi.fn().mockResolvedValue(['source doc']);
        mockPersistence.docs.set('source doc', new Uint8Array());

        const result = await renameDocument('source%20doc', 'target%2Fdoc');

        expect(result).toEqual({ ok: true });
    });
});

describe('deleteDocument', () => {
    let mockPersistence: ReturnType<typeof createMockPersistence>;

    beforeEach(() => {
        __setTestStoragePaths({
            lockFilePath: path.join(tempDir, `locks-${Date.now()}.json`),
            metadataFilePath: path.join(tempDir, `meta-${Date.now()}.json`)
        });
        __resetTestState();
        __clearTestPersistence();

        mockPersistence = createMockPersistence(['doc-to-delete']);
        __setTestPersistence(mockPersistence);
    });

    it('returns error when document name is empty', async () => {
        const result = await deleteDocument('');

        expect(result).toEqual({ ok: false, error: 'document_id_required' });
    });

    it('returns error when document does not exist', async () => {
        mockPersistence.getAllDocNames = vi.fn().mockResolvedValue(['other-doc']);

        const result = await deleteDocument('nonexistent');

        expect(result).toEqual({ ok: false, error: 'document_not_found' });
    });

    it('successfully deletes document from persistence', async () => {
        const result = await deleteDocument('doc-to-delete');

        expect(result).toEqual({ ok: true });
        expect(mockPersistence.clearDocument).toHaveBeenCalledWith('doc-to-delete');
    });

    it('normalizes document name before deleting', async () => {
        mockPersistence.getAllDocNames = vi.fn().mockResolvedValue(['doc to delete']);

        const result = await deleteDocument('doc%20to%20delete');

        expect(result).toEqual({ ok: true });
        expect(mockPersistence.clearDocument).toHaveBeenCalledWith('doc to delete');
    });
});

describe('listDocumentNames with mocked persistence', () => {
    let mockPersistence: ReturnType<typeof createMockPersistence>;

    beforeEach(() => {
        __setTestStoragePaths({
            lockFilePath: path.join(tempDir, `locks-${Date.now()}.json`),
            metadataFilePath: path.join(tempDir, `meta-${Date.now()}.json`)
        });
        __resetTestState();
        __clearTestPersistence();

        mockPersistence = createMockPersistence(['doc-a', 'doc-b', 'doc-c']);
        __setTestPersistence(mockPersistence);
    });

    it('returns document names from mocked persistence', async () => {
        const names = await listDocumentNames();

        expect(names).toContain('doc-a');
        expect(names).toContain('doc-b');
        expect(names).toContain('doc-c');
    });
});
