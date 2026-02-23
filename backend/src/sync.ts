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

type DocumentLockRecord = {
    salt: string;
    passwordHash: string;
    updatedAt: string;
};

type DocumentLocks = Record<string, DocumentLockRecord>;

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

const saveLocks = (locks: DocumentLocks) => {
    ensureLockDir();
    fs.writeFileSync(lockFilePath, JSON.stringify(locks, null, 2), 'utf-8');
};

let documentLocks: DocumentLocks = loadLocks();

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

        ydoc.on('update', (update: Uint8Array) => {
            persistence.storeUpdate(docName, update);
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

    setupWSConnectionOriginal(conn, req, { docName });
}
