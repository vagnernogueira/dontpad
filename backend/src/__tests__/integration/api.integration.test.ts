import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../server';
import { __clearTestPersistence, __resetTestState, __setTestPersistence, __setTestStoragePaths, removeDocumentPassword, setDocumentPassword } from '../../sync';
import fs from 'fs';
import os from 'os';
import path from 'path';
import * as Y from 'yjs';
import JSZip from 'jszip';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dontpad-api-test-'));

const createMockPersistence = (initialDocs: Map<string, string> = new Map()) => {
    const docs = new Map<string, Uint8Array>();

    initialDocs.forEach((content, name) => {
        const ydoc = new Y.Doc();
        ydoc.getText('codemirror').insert(0, content);
        docs.set(name, Y.encodeStateAsUpdate(ydoc));
    });

    return {
        getAllDocNames: async () => [...docs.keys()],
        getYDoc: async (docName: string) => {
            const ydoc = new Y.Doc();
            const stored = docs.get(docName);
            if (stored) {
                Y.applyUpdate(ydoc, stored);
            }
            return ydoc;
        }
    };
};

describe('api integration', () => {
    beforeEach(() => {
        __setTestStoragePaths({
            lockFilePath: path.join(tempDir, `locks-${Date.now()}.json`),
            metadataFilePath: path.join(tempDir, `meta-${Date.now()}.json`)
        });
        __resetTestState();
        __clearTestPersistence();
    });

    it('returns health status', async () => {
        const response = await request(app).get('/api/health');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'ok' });
    });

    it('renders raw document html with content already present in the response', async () => {
        const initialDocs = new Map<string, string>();
        initialDocs.set('teste', '# Documento\nLinha 2');
        __setTestPersistence(createMockPersistence(initialDocs));

        const response = await request(app).get('/teste?raw');

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('text/html');
        expect(response.text).toContain('<!doctype html><meta charset=utf-8>');
        expect(response.text).toContain('<pre># Documento\nLinha 2</pre>');
        expect(response.text).not.toContain('<h1>');
        expect(response.text).not.toContain('<style>');
    });

    it('renders a raw password message instead of exposing locked content without credentials', async () => {
        const initialDocs = new Map<string, string>();
        initialDocs.set('segredo', 'conteudo sensivel');
        __setTestPersistence(createMockPersistence(initialDocs));
        setDocumentPassword('segredo', '1234');

        const response = await request(app).get('/segredo?raw');

        expect(response.status).toBe(403);
        expect(response.headers['content-type']).toContain('text/html');
        expect(response.text).toContain('Este documento esta protegido por senha');
        expect(response.text).not.toContain('conteudo sensivel');

        removeDocumentPassword('segredo');
    });

    it('rejects lock status request without document id', async () => {
        const response = await request(app).get('/api/document-lock');

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('document_id_required');
    });

    it('creates and removes a document lock', async () => {
        const createResponse = await request(app)
            .post('/api/document-lock')
            .send({ documentId: 'locked-doc', password: 'top-secret' });

        expect(createResponse.status).toBe(200);
        expect(createResponse.body).toEqual({ locked: true });

        const wrongPasswordResponse = await request(app)
            .delete('/api/document-lock')
            .send({ documentId: 'locked-doc', password: 'wrong' });

        expect(wrongPasswordResponse.status).toBe(403);
        expect(wrongPasswordResponse.body.error).toBe('invalid_password');

        const successResponse = await request(app)
            .delete('/api/document-lock')
            .send({ documentId: 'locked-doc', password: 'top-secret' });

        expect(successResponse.status).toBe(200);
        expect(successResponse.body).toEqual({ locked: false });
    });

    it('requires correct password for document access', async () => {
        setDocumentPassword('secret-doc', 'letmein');

        const deniedResponse = await request(app)
            .post('/api/document-access')
            .send({ documentId: 'secret-doc', password: 'nope' });

        expect(deniedResponse.status).toBe(403);
        expect(deniedResponse.body.error).toBe('invalid_password');

        const allowedResponse = await request(app)
            .post('/api/document-access')
            .send({ documentId: 'secret-doc', password: 'letmein' });

        expect(allowedResponse.status).toBe(200);
        expect(allowedResponse.body).toEqual({ allowed: true });

        removeDocumentPassword('secret-doc');
    });

    it('filters document summaries by content substring when requested', async () => {
        const initialDocs = new Map<string, string>();
        initialDocs.set('alpha-doc', 'needle content');
        initialDocs.set('beta-doc', 'something else');
        initialDocs.set('gamma-doc', 'another Needle here');
        __setTestPersistence(createMockPersistence(initialDocs));

        const response = await request(app)
            .get('/api/documents')
            .set('x-docs-password', 'master')
            .query({ contentContains: 'needle' });

        expect(response.status).toBe(200);
        expect(response.body.summaries.map((summary: { name: string }) => summary.name)).toEqual(['alpha-doc', 'gamma-doc']);
        expect(response.body.documents).toEqual(['alpha-doc', 'beta-doc', 'gamma-doc']);
    });

    it('filters document summaries by regex when requested', async () => {
        const initialDocs = new Map<string, string>();
        initialDocs.set('alpha-doc', 'needle content');
        initialDocs.set('beta-doc', 'something else');
        initialDocs.set('gamma-doc', 'another Needle here');
        __setTestPersistence(createMockPersistence(initialDocs));

        const response = await request(app)
            .get('/api/documents')
            .set('x-docs-password', 'master')
            .query({ contentMatchesRegex: '^another\\s+needle' });

        expect(response.status).toBe(200);
        expect(response.body.summaries.map((summary: { name: string }) => summary.name)).toEqual(['gamma-doc']);
    });

    it('lists only template documents on the public templates endpoint', async () => {
        const initialDocs = new Map<string, string>();
        initialDocs.set('_tmpl/release-note', 'template content');
        initialDocs.set('_tmpl/checklist', '- item');
        initialDocs.set('regular-doc', 'content');
        __setTestPersistence(createMockPersistence(initialDocs));

        const response = await request(app).get('/api/document-templates');

        expect(response.status).toBe(200);
        expect(response.body.templates).toEqual(['_tmpl/checklist', '_tmpl/release-note']);
    });

    it('returns 400 for invalid regex filters', async () => {
        __setTestPersistence(createMockPersistence(new Map([['alpha-doc', 'needle content']])));

        const response = await request(app)
            .get('/api/documents')
            .set('x-docs-password', 'master')
            .query({ contentMatchesRegex: '(' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'invalid_content_regex' });
    });

    it('creates a zip backup with only non-empty documents and preserved paths', async () => {
        const initialDocs = new Map<string, string>();
        initialDocs.set('alpha-doc', 'Alpha content');
        initialDocs.set('me/todo', 'Nested todo');
        initialDocs.set('empty-doc', '');
        __setTestPersistence(createMockPersistence(initialDocs));

        const response = await request(app)
            .get('/api/documents/backup')
            .buffer(true)
            .parse((res, callback) => {
                const chunks: Buffer[] = [];
                res.on('data', chunk => {
                    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                });
                res.on('end', () => callback(null, Buffer.concat(chunks)));
            });

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('application/zip');
        expect(response.headers['content-disposition']).toContain('attachment; filename="dontpad-backup.zip"');

        const zip = await JSZip.loadAsync(response.body as Buffer);
        const fileNames = Object.keys(zip.files).filter(name => !zip.files[name].dir).sort();

        expect(fileNames).toEqual(['alpha-doc.md', 'me/todo.md']);
        await expect(zip.file('alpha-doc.md')?.async('string')).resolves.toBe('Alpha content');
        await expect(zip.file('me/todo.md')?.async('string')).resolves.toBe('Nested todo');
        expect(zip.file('empty-doc.md')).toBeNull();
    });
});