import * as Y from 'yjs';
// @ts-ignore
import { setupWSConnection as originalSetupWSConnection } from 'y-websocket/bin/utils';
import { LeveldbPersistence } from 'y-leveldb';
import path from 'path';

// Note: y-websocket doesn't type export its setup function well, so we use any
const setupWSConnectionOriginal = originalSetupWSConnection as any;

// Use y-leveldb as a backend for storing Yjs documents. We will store it in the db folder.
const dbPath = path.resolve(__dirname, '../../db/yjs-data');
const persistence = new LeveldbPersistence(dbPath);

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
    const docName = req.url.slice(1).split('?')[0] || 'default-doc';
    setupWSConnectionOriginal(conn, req, { docName });
}
