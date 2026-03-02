import * as Y from 'yjs';
// @ts-ignore
import { setupWSConnection as originalSetupWSConnection } from 'y-websocket/bin/utils';
import { LeveldbPersistence } from 'y-leveldb';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Note: y-websocket doesn't type export its setup function well, so we use any
const setupWSConnectionOriginal = originalSetupWSConnection as any;

// Use y-leveldb as a backend for storing Yjs documents. We will store it in the db folder.
const dbPath = path.resolve(__dirname, '../db/yjs-data');
const persistence = new LeveldbPersistence(dbPath);
const lockFilePath = path.resolve(__dirname, '../db/document-locks.json');
const metadataFilePath = path.resolve(__dirname, '../db/document-metadata.json');

type DocumentLockRecord = {
    salt: string;
    passwordHash: string;
    updatedAt: string;
};

type DocumentLocks = Record<string, DocumentLockRecord>;

type DocumentMetadataRecord = {
    createdAt: string;
    updatedAt: string;
};

type DocumentsMetadata = Record<string, DocumentMetadataRecord>;

export type DocumentSummary = {
    name: string;
    createdAt: string;
    updatedAt: string;
    locked: boolean;
    empty: boolean;
    open: boolean;
};

const masterPassword = (process.env.DOCUMENTS_MASTER_PASSWORD || '').trim();

const ensureLockDir = () => {
    const dir = path.dirname(lockFilePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const loadLocks = (): DocumentLocks => {
    try {
        if (!fs.existsSync(lockFilePath)) {
            return {};
        }

        const raw = fs.readFileSync(lockFilePath, 'utf-8');
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return {};
        }

        const entries = Object.entries(parsed as Record<string, unknown>)
            .filter(([name, value]) => {
                if (!name || typeof name !== 'string') return false;
                if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
                const record = value as Partial<DocumentLockRecord>;
                return typeof record.salt === 'string' && typeof record.passwordHash === 'string';
            })
            .map(([name, value]) => [name, value as DocumentLockRecord] as const);

        return Object.fromEntries(entries);
    } catch (error) {
        console.error('Failed to read lock file', error);
        return {};
    }
};

const loadMetadata = (): DocumentsMetadata => {
    try {
        if (!fs.existsSync(metadataFilePath)) {
            return {};
        }

        const raw = fs.readFileSync(metadataFilePath, 'utf-8');
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return {};
        }

        const entries = Object.entries(parsed as Record<string, unknown>)
            .filter(([name, value]) => {
                if (!name || typeof name !== 'string') return false;
                if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
                const record = value as Partial<DocumentMetadataRecord>;
                return typeof record.createdAt === 'string' && typeof record.updatedAt === 'string';
            })
            .map(([name, value]) => [name, value as DocumentMetadataRecord] as const);

        return Object.fromEntries(entries);
    } catch (error) {
        console.error('Failed to read metadata file', error);
        return {};
    }
};

const saveLocks = (locks: DocumentLocks) => {
    ensureLockDir();
    fs.writeFileSync(lockFilePath, JSON.stringify(locks, null, 2), 'utf-8');
};

const saveMetadata = (metadata: DocumentsMetadata) => {
    ensureLockDir();
    fs.writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2), 'utf-8');
};

let documentLocks: DocumentLocks = loadLocks();
let documentsMetadata: DocumentsMetadata = loadMetadata();
const activeDocumentSessions = new Map<string, number>();

const normalizeDocName = (value: string) => {
    return value
        .split('/')
        .map(part => {
            try {
                return decodeURIComponent(part);
            } catch {
                return part;
            }
        })
        .join('/');
};

const hashPassword = (password: string, salt: string) => {
    return crypto.scryptSync(password, salt, 64).toString('hex');
};

const equalsHash = (first: string, second: string) => {
    const a = Buffer.from(first, 'hex');
    const b = Buffer.from(second, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
};

const getDocumentLock = (docName: string): DocumentLockRecord | null => {
    const normalized = normalizeDocName(docName);
    return documentLocks[normalized] ?? null;
};

const getDocumentMetadata = (docName: string): DocumentMetadataRecord | null => {
    const normalized = normalizeDocName(docName);
    return documentsMetadata[normalized] ?? null;
};

const ensureDocumentMetadata = (docName: string, timestamp = new Date().toISOString()) => {
    const normalized = normalizeDocName(docName);
    const current = documentsMetadata[normalized];
    if (current) {
        return current;
    }

    const next: DocumentMetadataRecord = {
        createdAt: timestamp,
        updatedAt: timestamp
    };

    documentsMetadata = {
        ...documentsMetadata,
        [normalized]: next
    };

    saveMetadata(documentsMetadata);
    return next;
};

const touchDocumentUpdatedAt = (docName: string, timestamp = new Date().toISOString()) => {
    const normalized = normalizeDocName(docName);
    const current = ensureDocumentMetadata(normalized, timestamp);
    documentsMetadata = {
        ...documentsMetadata,
        [normalized]: {
            createdAt: current.createdAt,
            updatedAt: timestamp
        }
    };
    saveMetadata(documentsMetadata);
};

const removeDocumentMetadata = (docName: string) => {
    const normalized = normalizeDocName(docName);
    if (!documentsMetadata[normalized]) {
        return;
    }

    const nextMetadata = { ...documentsMetadata };
    delete nextMetadata[normalized];
    documentsMetadata = nextMetadata;
    saveMetadata(documentsMetadata);
};

const moveDocumentMetadata = (fromDocName: string, toDocName: string, timestamp = new Date().toISOString()) => {
    const source = normalizeDocName(fromDocName);
    const target = normalizeDocName(toDocName);

    const sourceMetadata = documentsMetadata[source] ?? ensureDocumentMetadata(source, timestamp);
    const nextMetadata = { ...documentsMetadata };
    delete nextMetadata[source];
    nextMetadata[target] = {
        createdAt: sourceMetadata.createdAt,
        updatedAt: timestamp
    };
    documentsMetadata = nextMetadata;
    saveMetadata(documentsMetadata);
};

const incrementOpenSession = (docName: string) => {
    const normalized = normalizeDocName(docName);
    const current = activeDocumentSessions.get(normalized) ?? 0;
    activeDocumentSessions.set(normalized, current + 1);
};

const decrementOpenSession = (docName: string) => {
    const normalized = normalizeDocName(docName);
    const current = activeDocumentSessions.get(normalized) ?? 0;
    if (current <= 1) {
        activeDocumentSessions.delete(normalized);
        return;
    }
    activeDocumentSessions.set(normalized, current - 1);
};

const isDocumentOpen = (docName: string) => {
    const normalized = normalizeDocName(docName);
    return (activeDocumentSessions.get(normalized) ?? 0) > 0;
};

const moveOpenSessions = (fromDocName: string, toDocName: string) => {
    const source = normalizeDocName(fromDocName);
    const target = normalizeDocName(toDocName);
    const count = activeDocumentSessions.get(source);
    if (!count) {
        return;
    }
    activeDocumentSessions.delete(source);
    activeDocumentSessions.set(target, (activeDocumentSessions.get(target) ?? 0) + count);
};

const removeOpenSessions = (docName: string) => {
    const normalized = normalizeDocName(docName);
    activeDocumentSessions.delete(normalized);
};

const clearDocumentFromPersistence = async (docName: string) => {
    const persistenceAny = persistence as any;
    if (typeof persistenceAny.clearDocument === 'function') {
        await persistenceAny.clearDocument(docName);
        return;
    }
    if (typeof persistenceAny.clearDoc === 'function') {
        await persistenceAny.clearDoc(docName);
        return;
    }
    throw new Error('clear_document_not_supported');
};

const canUseMasterPassword = (password: string) => {
    return !!masterPassword && password === masterPassword;
};

const verifyDocumentPassword = (docName: string, password: string) => {
    const lock = getDocumentLock(docName);
    if (!lock) return true;
    if (canUseMasterPassword(password)) return true;
    const candidateHash = hashPassword(password, lock.salt);
    return equalsHash(candidateHash, lock.passwordHash);
};

const extractPasswordFromReq = (req: any) => {
    const rawUrl = req?.url || '';
    const [, rawQuery = ''] = rawUrl.split('?');
    const params = new URLSearchParams(rawQuery);
    const password = params.get('password') || '';
    return password.trim();
};

export const listDocumentNames = async (): Promise<string[]> => {
    const names = await (persistence as any).getAllDocNames();
    return Array.isArray(names)
        ? names.filter((name: unknown): name is string => typeof name === 'string' && name.length > 0).sort((a, b) => a.localeCompare(b))
        : [];
}

export const getDocumentContent = async (docName: string): Promise<string> => {
    const normalized = normalizeDocName(docName);
    const ydoc = await persistence.getYDoc(normalized);
    const ytext = ydoc.getText('codemirror');
    return ytext.toString();
}

export const listDocumentSummaries = async (): Promise<DocumentSummary[]> => {
    const names = await listDocumentNames();

    const summaries = await Promise.all(names.map(async (name) => {
        const metadata = getDocumentMetadata(name) ?? ensureDocumentMetadata(name);
        const content = await getDocumentContent(name);

        return {
            name,
            createdAt: metadata.createdAt,
            updatedAt: metadata.updatedAt,
            locked: isDocumentLocked(name),
            empty: content.trim().length === 0,
            open: isDocumentOpen(name)
        } as DocumentSummary;
    }));

    return summaries;
}

export const isDocumentLocked = (docName: string): boolean => {
    return !!getDocumentLock(docName);
}

export const setDocumentPassword = (docName: string, password: string) => {
    const normalized = normalizeDocName(docName);
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);

    documentLocks = {
        ...documentLocks,
        [normalized]: {
            salt,
            passwordHash,
            updatedAt: new Date().toISOString()
        }
    };

    saveLocks(documentLocks);
};

export const removeDocumentPassword = (docName: string) => {
    const normalized = normalizeDocName(docName);
    if (!documentLocks[normalized]) {
        return;
    }

    const nextLocks = { ...documentLocks };
    delete nextLocks[normalized];
    documentLocks = nextLocks;
    saveLocks(documentLocks);
};

const moveDocumentPassword = (fromDocName: string, toDocName: string) => {
    const source = normalizeDocName(fromDocName);
    const target = normalizeDocName(toDocName);
    if (!documentLocks[source]) {
        return;
    }

    const nextLocks = { ...documentLocks };
    nextLocks[target] = {
        ...nextLocks[source],
        updatedAt: new Date().toISOString()
    };
    delete nextLocks[source];
    documentLocks = nextLocks;
    saveLocks(documentLocks);
};

export const renameDocument = async (fromDocName: string, toDocName: string): Promise<{ ok: true } | { ok: false; error: string }> => {
    const from = normalizeDocName(fromDocName).trim();
    const to = normalizeDocName(toDocName).trim();

    if (!from) {
        return { ok: false, error: 'source_document_required' };
    }
    if (!to) {
        return { ok: false, error: 'target_document_required' };
    }
    if (from === to) {
        return { ok: false, error: 'same_document_name' };
    }

    const names = await listDocumentNames();
    if (!names.includes(from)) {
        return { ok: false, error: 'source_document_not_found' };
    }
    if (names.includes(to)) {
        return { ok: false, error: 'target_document_already_exists' };
    }

    const sourceDoc = await persistence.getYDoc(from);
    const fullState = Y.encodeStateAsUpdate(sourceDoc);
    await persistence.storeUpdate(to, fullState);
    await clearDocumentFromPersistence(from);

    moveDocumentPassword(from, to);
    moveDocumentMetadata(from, to);
    moveOpenSessions(from, to);

    return { ok: true };
};

export const deleteDocument = async (docName: string): Promise<{ ok: true } | { ok: false; error: string }> => {
    const normalized = normalizeDocName(docName).trim();
    if (!normalized) {
        return { ok: false, error: 'document_id_required' };
    }

    const names = await listDocumentNames();
    if (!names.includes(normalized)) {
        return { ok: false, error: 'document_not_found' };
    }

    await clearDocumentFromPersistence(normalized);
    removeDocumentPassword(normalized);
    removeDocumentMetadata(normalized);
    removeOpenSessions(normalized);

    return { ok: true };
};

export const verifyDocumentAccess = (docName: string, password: string): boolean => {
    return verifyDocumentPassword(docName, password.trim());
}

export const verifyDocumentsMasterPassword = (password: string): boolean => {
    if (!masterPassword) return true;
    return password.trim() === masterPassword;
}

// y-websocket looks at 'setPersistence' on its util object
// @ts-ignore
import * as utils from 'y-websocket/bin/utils';

(utils as any).setPersistence({
    bindState: async (docName: string, ydoc: Y.Doc) => {
        // Here you listen to sync events and write documents to the database.
        const persistedYdoc = await persistence.getYDoc(docName);

        // Merge the existing state from the database into the new document in memory
        const newUpdates = Y.encodeStateAsUpdate(ydoc);
        persistence.storeUpdate(docName, newUpdates);

        Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));

        ensureDocumentMetadata(docName);

        ydoc.on('update', (update: Uint8Array) => {
            persistence.storeUpdate(docName, update);
            touchDocumentUpdatedAt(docName);
        });
    },
    writeState: async (docName: string, ydoc: Y.Doc) => {
        // This is called when all clients disconnect.
        // For LevelDB we can just trust the incrementally stored updates.
        return Promise.resolve();
    }
});

export default function setupWSConnection(conn: any, req: any) {
    // Extract docName from URL path (e.g. /ws/my-doc -> my-doc)
    // If connection is straight to root we can assign a default or handle it
    const rawPath = req.url.slice(1).split('?')[0] || 'default-doc';
    const normalizedPath = rawPath
        .replace(/^api\//, '')
        .replace(/^ws\//, '')
        .replace(/^socket\//, '');
    const docName = normalizeDocName(normalizedPath || 'default-doc');

    if (isDocumentLocked(docName)) {
        const password = extractPasswordFromReq(req);
        if (!verifyDocumentPassword(docName, password)) {
            conn.close(4403, 'forbidden');
            return;
        }
    }

    incrementOpenSession(docName);
    conn.on('close', () => {
        decrementOpenSession(docName);
    });

    setupWSConnectionOriginal(conn, req, { docName });
}
