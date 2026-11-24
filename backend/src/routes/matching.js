import { Router } from 'express';
import { AppError, id, text } from '../http.js';
import { ensureMatch, publicProfile, requireMatch, suggestions } from '../repositories/matching.js';
import { first } from '../db.js';
import { publicFields } from '../repositories/users.js';

export function matchingRoutes(db) {
  const router = Router();
  router.get('/suggestions', async (req, res) => res.json(await suggestions(db, req.userId, text(100, 0).parse(req.query.q ?? ''))));
  router.get('/users/:id', async (req, res) => res.json(await publicProfile(db, req.userId, id.parse(req.params.id))));
  router.post('/matches', async (req, res) => res.json(await ensureMatch(db, req.userId, id.parse(req.body?.userId))));
  router.get('/matches/:id', async (req, res) => {
    const match = await requireMatch(db, req.userId, id.parse(req.params.id));
    if (match.status !== 'active') throw new AppError(409, 'A conversa está encerrada.');
    res.json({ id: match.id, peer: await first(db, `SELECT ${publicFields} FROM users WHERE id=$1`, [match.peerId]) });
  });
  return router;
}
