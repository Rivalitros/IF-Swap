import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { AppError, checkOrigin, databaseMessage, publicError } from './http.js';
import { migrate } from '../database/migrate.js';
import { accountRoutes } from './routes/accounts.js';
import { profileRoutes } from './routes/profile.js';
import { matchingRoutes } from './routes/matching.js';
import { chatRoutes } from './routes/chat.js';
import { agendaRoutes, announce } from './routes/agenda.js';
import { completeEnded } from './repositories/agenda.js';
import { reviewRoutes } from './routes/reviews.js';
import { challengeRoutes } from './routes/challenges.js';
import { realtime } from './realtime.js';
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
  const live = realtime(server, db, ready);
  let checking = false;
  const clock = setInterval(async () => {
    if (checking) return;
    checking = true;
    try {
      await ready();
      for (const appointment of await completeEnded(db)) announce(live, appointment);
    } catch (error) {
      if (publicError(error).status === 503) return;
    } finally {
      checking = false;
    }
  }, 30_000);
  clock.unref();
  server.once('close', () => clearInterval(clock));

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
  app.use('/api/auth', accountRoutes(db, live.logout));
  app.use('/api', requireSession(db));
  app.use('/api/profile', profileRoutes(db));
  app.use('/api', matchingRoutes(db));
  app.use('/api', chatRoutes(db));
  app.use('/api/agenda', agendaRoutes(db, live));
  app.use('/api', reviewRoutes(db));
  app.use('/api/challenges', challengeRoutes(db));
  app.use('/api/photos', express.static(fileURLToPath(uploads), { index: false, redirect: false }));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Recurso não encontrado.' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const { status, message } = publicError(error);
    res.status(status).json({ error: message });
  });
  return { app, server, io: live.io };
}
