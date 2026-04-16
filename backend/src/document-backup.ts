import JSZip from 'jszip';
import { getDocumentContent, listDocumentNames, normalizeDocName } from './sync';

export interface DocumentBackupEntry {
    path: string;
    content: string;
}

const BACKUP_FILE_EXTENSION = '.md';

const normalizeBackupPath = (docName: string) => {
    return normalizeDocName(docName)
        .replace(/\\/g, '/')
        .trim()
        .split('/')
        .filter(part => part.length > 0 && part !== '.' && part !== '..')
        .join('/');
};

export const getBackupEntryPath = (docName: string) => {
    const normalized = normalizeBackupPath(docName);
    if (!normalized) {
        return '';
    }

    return normalized.endsWith(BACKUP_FILE_EXTENSION)
        ? normalized
        : `${normalized}${BACKUP_FILE_EXTENSION}`;
};

export const collectBackupEntries = async (): Promise<DocumentBackupEntry[]> => {
    const names = await listDocumentNames();
    const entries = await Promise.all(names.map(async name => {
        const content = await getDocumentContent(name);
        if (content.trim().length === 0) {
            return null;
        }

        const path = getBackupEntryPath(name);
        if (!path) {
            return null;
        }

        return { path, content };
    }));

    return entries.filter((entry): entry is DocumentBackupEntry => entry !== null);
};

export const buildDocumentsBackupArchive = async (): Promise<Buffer> => {
    const zip = new JSZip();
    const entries = await collectBackupEntries();

    for (const entry of entries) {
        zip.file(entry.path, entry.content);
    }

    return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
};