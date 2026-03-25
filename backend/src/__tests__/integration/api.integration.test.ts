import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../server';
import { __resetTestState, __setTestStoragePaths, removeDocumentPassword, setDocumentPassword } from '../../sync';
import fs from 'fs';
import os from 'os';
import path from 'path';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dontpad-api-test-'));

describe('api integration', () => {
    beforeEach(() => {
        __setTestStoragePaths({
            lockFilePath: path.join(tempDir, `locks-${Date.now()}.json`),
            metadataFilePath: path.join(tempDir, `meta-${Date.now()}.json`)
        });
        __resetTestState();
    });

    it('returns health status', async () => {
        const response = await request(app).get('/api/health');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'ok' });
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
});