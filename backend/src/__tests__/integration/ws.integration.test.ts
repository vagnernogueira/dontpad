import http from 'http';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import WebSocket, { WebSocketServer } from 'ws';
import fs from 'fs';
import os from 'os';
import path from 'path';

vi.mock('y-websocket/bin/utils', async () => {
    const actual = await vi.importActual<typeof import('y-websocket/bin/utils')>('y-websocket/bin/utils');

    return {
        ...actual,
        setupWSConnection: (conn: WebSocket) => {
            conn.send('connected');
        }
    };
});

const syncModule = await import('../../sync');
const setupWSConnection = syncModule.default;
const { __resetTestState, __setTestStoragePaths, setDocumentPassword } = syncModule;

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dontpad-ws-test-'));

describe('websocket lock enforcement', () => {
    let server: http.Server;
    let address = '';

    beforeAll(async () => {
        server = http.createServer();
        const wss = new WebSocketServer({ server });
        wss.on('connection', (conn, req) => {
            setupWSConnection(conn, req);
        });

        await new Promise<void>(resolve => server.listen(0, resolve));
        const serverAddress = server.address();
        if (!serverAddress || typeof serverAddress === 'string') {
            throw new Error('failed_to_get_test_server_address');
        }
        address = `ws://127.0.0.1:${serverAddress.port}`;
    });

    afterAll(async () => {
        await new Promise<void>((resolve, reject) => {
            server.close(error => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    });

    beforeEach(() => {
        __setTestStoragePaths({
            lockFilePath: path.join(tempDir, `locks-${Date.now()}.json`),
            metadataFilePath: path.join(tempDir, `meta-${Date.now()}.json`)
        });
        __resetTestState();
    });

    it('connects to unlocked document', async () => {
        await new Promise<void>((resolve, reject) => {
            const ws = new WebSocket(`${address}/open-doc`);
            ws.once('open', () => {
                ws.close();
                resolve();
            });
            ws.once('error', reject);
        });
    });

    it('rejects locked document without password using close code 4403', async () => {
        setDocumentPassword('private-doc', 'secret');

        const closeCode = await new Promise<number>((resolve, reject) => {
            const ws = new WebSocket(`${address}/private-doc`);
            ws.once('close', code => resolve(code));
            ws.once('error', reject);
        });

        expect(closeCode).toBe(4403);
    });

    it('accepts locked document with correct password', async () => {
        setDocumentPassword('private-doc', 'secret');

        await new Promise<void>((resolve, reject) => {
            const ws = new WebSocket(`${address}/private-doc?password=secret`);
            ws.once('open', () => {
                ws.close();
                resolve();
            });
            ws.once('error', reject);
        });
    });
});