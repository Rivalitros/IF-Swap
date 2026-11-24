import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { AppError, checkOrigin, databaseMessage, publicError } from './http.js';
import { migrate } from '../database/migrate.js';
import { accountRoutes } from './routes/accounts.js';
import { profileRoutes } from './routes/profile.js';
import { requireSession } from './services/sessions.js';
import { uploads } from './services/profile.js';

export function createApplication(db) {
  const app = express();
  const server = createServer(app);
  let migration;
  const ready = () => migration ??= migrate(db).catch(error => {
    migration = undefined;
    console.error('Inicialização PostgreSQL:', error.code || error.message);
    throw new AppError(503, databaseMessage);
  });
  ready().catch(() => {});

  app.disable('x-powered-by');
  app.use('/api', (req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Cache-Control', 'no-store');
    if (!checkOrigin(req)) throw new AppError(403, 'Origem inválida.');
    next();
  });
  app.use('/api', express.json({ limit: '32kb' }));
  app.use('/api', async (req, res, next) => {
    await ready();
    next();
  });
  app.get('/api/health', async (req, res) => {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'online' });
  });
  app.use('/api/auth', accountRoutes(db, () => {}));
  app.use('/api', requireSession(db));
  app.use('/api/profile', profileRoutes(db));
  app.use('/api/photos', express.static(fileURLToPath(uploads), { index: false, redirect: false }));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Recurso não encontrado.' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const { status, message } = publicError(error);
    res.status(status).json({ error: message });
  });
  return { app, server };
}
