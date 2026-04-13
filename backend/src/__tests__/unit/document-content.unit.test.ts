import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';
import {
    __clearTestPersistence,
    __resetTestState,
    __setTestStoragePaths,
    __setTestPersistence,
    getDocumentContent,
    listDocumentSummaries,
    matchesContentContains,
    matchesContentRegex,
    isDocumentLocked,
    setDocumentPassword,
    removeDocumentPassword,
    normalizeDocName,
    tryCreateCaseInsensitiveRegex
} from '../../sync';
import fs from 'fs';
import os from 'os';
import path from 'path';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dontpad-content-test-'));

const createMockPersistence = (initialDocs: Map<string, string> = new Map()) => {
    const docs = new Map<string, Uint8Array>();
    
    initialDocs.forEach((content, name) => {
        const ydoc = new Y.Doc();
        ydoc.getText('codemirror').insert(0, content);
        docs.set(name, Y.encodeStateAsUpdate(ydoc));
    });

    return {
        docs,
        getAllDocNames: vi.fn().mockResolvedValue([...docs.keys()]),
        getYDoc: vi.fn().mockImplementation(async (docName: string) => {
            const ydoc = new Y.Doc();
            const stored = docs.get(docName);
            if (stored) {
                Y.applyUpdate(ydoc, stored);
            }
            return ydoc;
        }),
        storeUpdate: vi.fn().mockImplementation(async (docName: string, update: Uint8Array) => {
            docs.set(docName, update);
        }),
        clearDocument: vi.fn().mockImplementation(async (docName: string) => {
            docs.delete(docName);
        })
    };
};

describe('getDocumentContent', () => {
    let mockPersistence: ReturnType<typeof createMockPersistence>;

    beforeEach(() => {
        __setTestStoragePaths({
            lockFilePath: path.join(tempDir, `locks-${Date.now()}.json`),
            metadataFilePath: path.join(tempDir, `meta-${Date.now()}.json`)
        });
        __resetTestState();
        __clearTestPersistence();
    });

    it('returns empty string for new document', async () => {
        mockPersistence = createMockPersistence();
        mockPersistence.getAllDocNames = vi.fn().mockResolvedValue(['new-doc']);
        __setTestPersistence(mockPersistence);

        const content = await getDocumentContent('new-doc');

        expect(content).toBe('');
    });

    it('returns document content from persistence', async () => {
        const initialDocs = new Map<string, string>();
        initialDocs.set('existing-doc', 'Hello World');
        mockPersistence = createMockPersistence(initialDocs);
        __setTestPersistence(mockPersistence);

        const content = await getDocumentContent('existing-doc');

        expect(content).toBe('Hello World');
    });

    it('returns content with multiple paragraphs', async () => {
        const initialDocs = new Map<string, string>();
        initialDocs.set('multi-para', 'Line 1\n\nLine 2\n\nLine 3');
        mockPersistence = createMockPersistence(initialDocs);
        __setTestPersistence(mockPersistence);

        const content = await getDocumentContent('multi-para');

        expect(content).toBe('Line 1\n\nLine 2\n\nLine 3');
    });

    it('normalizes document name before fetching', async () => {
        const initialDocs = new Map<string, string>();
        initialDocs.set('my doc', 'Test content');
        mockPersistence = createMockPersistence(initialDocs);
        mockPersistence.getAllDocNames = vi.fn().mockResolvedValue(['my doc']);
        __setTestPersistence(mockPersistence);

        const content = await getDocumentContent('my%20doc');

        expect(content).toBe('Test content');
    });
});

describe('listDocumentSummaries', () => {
    let mockPersistence: ReturnType<typeof createMockPersistence>;

    beforeEach(() => {
        __setTestStoragePaths({
            lockFilePath: path.join(tempDir, `locks-${Date.now()}.json`),
            metadataFilePath: path.join(tempDir, `meta-${Date.now()}.json`)
        });
        __resetTestState();
        __clearTestPersistence();
    });

    it('returns empty array when no documents exist', async () => {
        mockPersistence = createMockPersistence();
        mockPersistence.getAllDocNames = vi.fn().mockResolvedValue([]);
        __setTestPersistence(mockPersistence);

        const summaries = await listDocumentSummaries();

        expect(summaries).toEqual([]);
    });

    it('returns summaries with correct metadata', async () => {
        const initialDocs = new Map<string, string>();
        initialDocs.set('doc-a', 'content');
        mockPersistence = createMockPersistence(initialDocs);
        __setTestPersistence(mockPersistence);

        const summaries = await listDocumentSummaries();

        expect(summaries).toHaveLength(1);
        expect(summaries[0].name).toBe('doc-a');
        expect(summaries[0].empty).toBe(false);
        expect(summaries[0].locked).toBe(false);
        expect(summaries[0].open).toBe(false);
        expect(summaries[0].createdAt).toBeDefined();
        expect(summaries[0].updatedAt).toBeDefined();
    });

    it('marks empty documents correctly', async () => {
        const initialDocs = new Map<string, string>();
        initialDocs.set('empty-doc', '');
        initialDocs.set('filled-doc', 'some content');
        mockPersistence = createMockPersistence(initialDocs);
        __setTestPersistence(mockPersistence);

        const summaries = await listDocumentSummaries();
        const emptyDoc = summaries.find(s => s.name === 'empty-doc');
        const filledDoc = summaries.find(s => s.name === 'filled-doc');

        expect(emptyDoc?.empty).toBe(true);
        expect(filledDoc?.empty).toBe(false);
    });

    it('marks locked documents correctly', async () => {
        const initialDocs = new Map<string, string>();
        initialDocs.set('locked-doc', 'content');
        mockPersistence = createMockPersistence(initialDocs);
        __setTestPersistence(mockPersistence);
        setDocumentPassword('locked-doc', 'secret');

        const summaries = await listDocumentSummaries();
        const lockedDoc = summaries.find(s => s.name === 'locked-doc');

        expect(lockedDoc?.locked).toBe(true);

        removeDocumentPassword('locked-doc');
    });

    it('filters documents by content substring when requested', async () => {
        const initialDocs = new Map<string, string>();
        initialDocs.set('alpha-doc', 'Needle in haystack');
        initialDocs.set('beta-doc', 'different content');
        initialDocs.set('gamma-doc', 'another needle appears');
        mockPersistence = createMockPersistence(initialDocs);
        __setTestPersistence(mockPersistence);

        const summaries = await listDocumentSummaries({ contentContains: 'needle' });

        expect(summaries.map(summary => summary.name)).toEqual(['alpha-doc', 'gamma-doc']);
    });

    it('filters documents by regex when requested', async () => {
        const initialDocs = new Map<string, string>();
        initialDocs.set('alpha-doc', 'Needle in haystack');
        initialDocs.set('beta-doc', 'different content');
        initialDocs.set('gamma-doc', 'another Needle appears');
        mockPersistence = createMockPersistence(initialDocs);
        __setTestPersistence(mockPersistence);

        const summaries = await listDocumentSummaries({ contentMatchesRegex: '^another\\s+needle' });

        expect(summaries.map(summary => summary.name)).toEqual(['gamma-doc']);
    });

    it('rejects invalid regex patterns', async () => {
        mockPersistence = createMockPersistence(new Map([['doc-a', 'content']]));
        __setTestPersistence(mockPersistence);

        await expect(listDocumentSummaries({ contentMatchesRegex: '(' })).rejects.toThrow('invalid_content_regex');
    });
});

describe('matchesContentContains', () => {
    it('returns true when no content filter is provided', () => {
        expect(matchesContentContains('Any content', '')).toBe(true);
    });

    it('matches content case-insensitively', () => {
        expect(matchesContentContains('Needle in haystack', 'needle')).toBe(true);
        expect(matchesContentContains('Needle in haystack', 'HAYSTACK')).toBe(true);
    });

    it('returns false when content does not contain the substring', () => {
        expect(matchesContentContains('Needle in haystack', 'missing')).toBe(false);
    });
});

describe('regex content helpers', () => {
    it('creates case-insensitive regex safely', () => {
        expect(tryCreateCaseInsensitiveRegex('needle')?.test('Needle')).toBe(true);
    });

    it('returns null for invalid regex patterns', () => {
        expect(tryCreateCaseInsensitiveRegex('(')).toBeNull();
    });

    it('matches content using regex case-insensitively', () => {
        expect(matchesContentRegex('Needle in haystack', '^needle')).toBe(true);
    });

    it('returns false for invalid regex patterns', () => {
        expect(matchesContentRegex('Needle in haystack', '(')).toBe(false);
    });
});

describe('isDocumentLocked', () => {
    beforeEach(() => {
        __setTestStoragePaths({
            lockFilePath: path.join(tempDir, `locks-${Date.now()}.json`),
            metadataFilePath: path.join(tempDir, `meta-${Date.now()}.json`)
        });
        __resetTestState();
    });

    it('returns false when document has no lock', () => {
        expect(isDocumentLocked('unlocked-doc')).toBe(false);
    });

    it('returns true when document has a lock', () => {
        setDocumentPassword('locked-doc', 'secret');

        expect(isDocumentLocked('locked-doc')).toBe(true);

        removeDocumentPassword('locked-doc');
    });

    it('normalizes document name before checking', () => {
        setDocumentPassword('my locked doc', 'secret');

        expect(isDocumentLocked('my%20locked%20doc')).toBe(true);

        removeDocumentPassword('my locked doc');
    });
});

describe('normalizeDocName edge cases', () => {
    it('handles URL encoded forward slash', () => {
        expect(normalizeDocName('folder%2Ffile.md')).toBe('folder/file.md');
    });

    it('handles URL encoded space', () => {
        expect(normalizeDocName('my%20doc')).toBe('my doc');
    });

    it('handles mixed encoded and plain characters', () => {
        expect(normalizeDocName('folder a/doc%2Fname')).toBe('folder a/doc/name');
    });

    it('handles invalid URL encoding gracefully', () => {
        expect(normalizeDocName('doc%GG')).toBe('doc%GG');
    });

    it('preserves slashes in path', () => {
        expect(normalizeDocName('a/b/c')).toBe('a/b/c');
    });
});
