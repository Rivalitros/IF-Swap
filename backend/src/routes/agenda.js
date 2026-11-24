import { Router } from 'express';
import { z } from 'zod';
import { id, text } from '../http.js';
import { agenda, completeEnded, propose, updateAppointment } from '../repositories/agenda.js';

const range = z.object({
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }),
  location: text(240),
  modality: z.enum(['presencial', 'online']),
});
const ordered = data => Date.parse(data.endsAt) > Date.parse(data.startsAt);
const proposal = range.extend({ matchId: id }).refine(ordered, { path: ['endsAt'] });
const action = z.union([
  z.object({ action: z.enum(['accept', 'decline', 'cancel', 'start', 'complete']) }),
  range.extend({ action: z.literal('change'), reason: text(240, 0).optional() }).refine(ordered, { path: ['endsAt'] }),
]);

export function announce(live, { item, ids }) {
  live.notify(ids, 'agenda:update', { id: item.id, matchId: item.match_id, status: item.status });
  return item;
}

export function agendaRoutes(db, live) {
  const router = Router();
  router.get('/', async (req, res) => {
    for (const result of await completeEnded(db)) announce(live, result);
    res.json(await agenda(db, req.userId));
  });
  router.post('/', async (req, res) => {
    res.status(201).json(announce(live, await propose(db, req.userId, proposal.parse(req.body))));
  });
  router.patch('/:id', async (req, res) => {
    res.json(announce(live, await updateAppointment(db, req.userId, id.parse(req.params.id), action.parse(req.body))));
  });
  return router;
}
