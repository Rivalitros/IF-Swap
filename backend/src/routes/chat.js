import { Router } from 'express';
import { id } from '../http.js';
import { conversations, history } from '../repositories/chat.js';

export function chatRoutes(db) {
  const router = Router();
  router.get('/matches', async (req, res) => res.json(await conversations(db, req.userId)));
  router.get('/matches/:id/messages', async (req, res) => {
    const before = req.query.before === undefined ? null : id.parse(req.query.before);
    res.json(await history(db, req.userId, id.parse(req.params.id), before));
  });
  return router;
}
