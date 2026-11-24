import { Router } from 'express';
import { z } from 'zod';
import { first } from '../db.js';
import { AppError, id, text } from '../http.js';
import { challengeReplies, challenges, publish, respond } from '../repositories/challenges.js';

const publication = z.object({ description: text(2000, 5), deadline: z.iso.date() });
const reply = z.object({ message: text(2000), parentId: id.optional() });
const status = z.enum(['aberto', 'encerrado']);

export function challengeRoutes(db) {
  const router = Router();
  router.get('/', async (req, res) => res.json(await challenges(db,
    status.optional().parse(req.query.status) ?? null, id.optional().parse(req.query.before) ?? null)));
  router.post('/', async (req, res) => res.status(201).json(await publish(db, req.userId, publication.parse(req.body))));
  router.get('/:id/replies', async (req, res) => res.json(await challengeReplies(db, id.parse(req.params.id))));
  router.post('/:id/replies', async (req, res) => {
    res.status(201).json(await respond(db, req.userId, id.parse(req.params.id), reply.parse(req.body)));
  });
  router.patch('/:id/close', async (req, res) => {
    const item = await first(db, "UPDATE challenges SET status='encerrado' WHERE id=$1 AND author_id=$2 RETURNING id,status",
      [id.parse(req.params.id), req.userId]);
    if (!item) throw new AppError(404, 'Desafio indisponível para encerramento.');
    res.json(item);
  });
  return router;
}
