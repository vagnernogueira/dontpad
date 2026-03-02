import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import setupWSConnection from './sync';
import { listDocumentNames, listDocumentSummaries, getDocumentContent, renameDocument, deleteDocument } from './sync';
import { isDocumentLocked, setDocumentPassword, verifyDocumentAccess, verifyDocumentsMasterPassword } from './sync';
import { removeDocumentPassword } from './sync';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);

// Simple health check or API route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/api/documents', async (req, res) => {
    try {
        const providedPassword = typeof req.headers['x-docs-password'] === 'string' ? req.headers['x-docs-password'] : '';
        if (!verifyDocumentsMasterPassword(providedPassword)) {
            res.status(403).json({ error: 'invalid_password' });
            return;
        }

        const documents = await listDocumentNames();
        const summaries = await listDocumentSummaries();
        res.json({ documents, summaries });
    } catch (error) {
        console.error('Failed to list documents', error);
        res.status(500).json({ error: 'failed_to_list_documents' });
    }
});

app.get('/api/document-content', async (req, res) => {
    try {
        const providedPassword = typeof req.headers['x-docs-password'] === 'string' ? req.headers['x-docs-password'] : '';
        if (!verifyDocumentsMasterPassword(providedPassword)) {
            res.status(403).json({ error: 'invalid_password' });
            return;
        }

        const documentId = typeof req.query.documentId === 'string' ? req.query.documentId : '';
        if (!documentId.trim()) {
            res.status(400).json({ error: 'document_id_required' });
            return;
        }

        const content = await getDocumentContent(documentId);
        res.json({ documentId, content });
    } catch (error) {
        console.error('Failed to load document content', error);
        res.status(500).json({ error: 'failed_to_load_document_content' });
    }
});

app.post('/api/documents/rename', async (req, res) => {
    try {
        const providedPassword = typeof req.headers['x-docs-password'] === 'string' ? req.headers['x-docs-password'] : '';
        if (!verifyDocumentsMasterPassword(providedPassword)) {
            res.status(403).json({ error: 'invalid_password' });
            return;
        }

        const from = typeof req.body?.from === 'string' ? req.body.from : '';
        const to = typeof req.body?.to === 'string' ? req.body.to : '';
        const result = await renameDocument(from, to);

        if (!result.ok) {
            const status = result.error === 'source_document_not_found' ? 404 : 400;
            res.status(status).json({ error: result.error });
            return;
        }

        res.json({ ok: true });
    } catch (error) {
        console.error('Failed to rename document', error);
        res.status(500).json({ error: 'failed_to_rename_document' });
    }
});

app.delete('/api/documents', async (req, res) => {
    try {
        const providedPassword = typeof req.headers['x-docs-password'] === 'string' ? req.headers['x-docs-password'] : '';
        if (!verifyDocumentsMasterPassword(providedPassword)) {
            res.status(403).json({ error: 'invalid_password' });
            return;
        }

        const documentId = typeof req.body?.documentId === 'string' ? req.body.documentId : '';
        const result = await deleteDocument(documentId);
        if (!result.ok) {
            const status = result.error === 'document_not_found' ? 404 : 400;
            res.status(status).json({ error: result.error });
            return;
        }

        res.json({ ok: true });
    } catch (error) {
        console.error('Failed to delete document', error);
        res.status(500).json({ error: 'failed_to_delete_document' });
    }
});

app.get('/api/document-lock', (req, res) => {
    const documentId = typeof req.query.documentId === 'string' ? req.query.documentId : '';
    if (!documentId.trim()) {
        res.status(400).json({ error: 'document_id_required' });
        return;
    }

    res.json({ locked: isDocumentLocked(documentId) });
});

app.post('/api/document-lock', (req, res) => {
    const documentId = typeof req.body?.documentId === 'string' ? req.body.documentId : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!documentId.trim()) {
        res.status(400).json({ error: 'document_id_required' });
        return;
    }

    if (!password.trim()) {
        res.status(400).json({ error: 'password_required' });
        return;
    }

    setDocumentPassword(documentId, password);
    res.json({ locked: true });
});

app.delete('/api/document-lock', (req, res) => {
    const documentId = typeof req.body?.documentId === 'string' ? req.body.documentId : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!documentId.trim()) {
        res.status(400).json({ error: 'document_id_required' });
        return;
    }

    if (!isDocumentLocked(documentId)) {
        res.json({ locked: false });
        return;
    }

    if (!verifyDocumentAccess(documentId, password)) {
        res.status(403).json({ error: 'invalid_password' });
        return;
    }

    removeDocumentPassword(documentId);
    res.json({ locked: false });
});

app.post('/api/document-access', (req, res) => {
    const documentId = typeof req.body?.documentId === 'string' ? req.body.documentId : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!documentId.trim()) {
        res.status(400).json({ error: 'document_id_required' });
        return;
    }

    const allowed = verifyDocumentAccess(documentId, password);
    if (!allowed) {
        res.status(403).json({ error: 'invalid_password' });
        return;
    }

    res.json({ allowed: true });
});

// Setup WebSocket Server
const wss = new WebSocketServer({ server });

wss.on('connection', (conn, req) => {
    setupWSConnection(conn, req);
});

const PORT = process.env.PORT || 1234;

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
