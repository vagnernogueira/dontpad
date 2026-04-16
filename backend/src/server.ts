import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import setupWSConnection from './sync';
import { listDocumentNames, listDocumentSummaries, listTemplateNames, getDocumentContent, renameDocument, deleteDocument } from './sync';
import { isDocumentLocked, setDocumentPassword, verifyDocumentAccess, verifyDocumentsMasterPassword } from './sync';
import { removeDocumentPassword } from './sync';
import cors from 'cors';
import { buildDocumentsBackupArchive } from './document-backup';

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
        const contentContains = typeof req.query.contentContains === 'string' ? req.query.contentContains : '';
        const contentMatchesRegex = typeof req.query.contentMatchesRegex === 'string' ? req.query.contentMatchesRegex : '';
        if (!verifyDocumentsMasterPassword(providedPassword)) {
            res.status(403).json({ error: 'invalid_password' });
            return;
        }

        const documents = await listDocumentNames();
        const summaries = await listDocumentSummaries({ contentContains, contentMatchesRegex });
        res.json({ documents, summaries });
    } catch (error) {
        if (error instanceof Error && (error.message === 'invalid_content_regex' || error.message === 'content_filter_mode_conflict')) {
            res.status(400).json({ error: error.message });
            return;
        }

        console.error('Failed to list documents', error);
        res.status(500).json({ error: 'failed_to_list_documents' });
    }
});

app.get('/api/document-templates', async (_req, res) => {
    try {
        const templates = await listTemplateNames();
        res.json({ templates });
    } catch (error) {
        console.error('Failed to list document templates', error);
        res.status(500).json({ error: 'failed_to_list_document_templates' });
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

app.get('/api/public-document-content', async (req, res) => {
    try {
        const documentId = typeof req.query.documentId === 'string' ? req.query.documentId : '';
        if (!documentId.trim()) {
            res.status(400).json({ error: 'document_id_required' });
            return;
        }

        const password = typeof req.query.password === 'string' ? req.query.password : '';
        if (isDocumentLocked(documentId) && !verifyDocumentAccess(documentId, password)) {
            res.status(403).json({ error: 'invalid_password' });
            return;
        }

        const content = await getDocumentContent(documentId);
        res.json({ documentId, content });
    } catch (error) {
        console.error('Failed to load public document content', error);
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

app.get('/api/documents/backup', async (req, res) => {
    try {
        const providedPassword = typeof req.headers['x-docs-password'] === 'string' ? req.headers['x-docs-password'] : '';
        if (!verifyDocumentsMasterPassword(providedPassword)) {
            res.status(403).json({ error: 'invalid_password' });
            return;
        }

        const archive = await buildDocumentsBackupArchive();
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="dontpad-backup.zip"');
        res.send(archive);
    } catch (error) {
        console.error('Failed to build document backup', error);
        res.status(500).json({ error: 'failed_to_build_document_backup' });
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

app.get('/api/client-info', (req, res) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.socket.remoteAddress || '';
    res.json({ ip });
});

// Setup WebSocket Server
const wss = new WebSocketServer({ server });

wss.on('connection', (conn, req) => {
    void setupWSConnection(conn, req);
});

const PORT = process.env.PORT || 1234;

if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

export { app, server, wss };
