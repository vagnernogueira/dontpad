import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import setupWSConnection from './sync';
import { listDocumentNames } from './sync';
import cors from 'cors';

const app = express();
app.use(cors());
const server = http.createServer(app);

// Simple health check or API route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/api/documents', async (req, res) => {
    try {
        const documents = await listDocumentNames();
        res.json({ documents });
    } catch (error) {
        console.error('Failed to list documents', error);
        res.status(500).json({ error: 'failed_to_list_documents' });
    }
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
