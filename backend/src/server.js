import { createServer } from 'node:http';
import express from 'express';
import { host, port } from './config.js';

const app = express();
app.disable('x-powered-by');
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
createServer(app).listen(port, host, () => console.log(`IF Swap em http://${host}:${port}`));
