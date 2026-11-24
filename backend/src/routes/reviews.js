import { Router } from 'express';
import { z } from 'zod';
import { first } from '../db.js';
import { AppError, id, text } from '../http.js';

const rating = z.object({ rating: z.number().int().min(1).max(5), comment: text(1000, 0).optional() });

export function reviewRoutes(db) {
  const router = Router();
  router.post('/agenda/:id/reviews', async (req, res) => {
    const appointmentId = id.parse(req.params.id);
    const data = rating.parse(req.body);
    const item = await first(db, `SELECT a.status, a.ends_at<=now() AS ended,
      CASE WHEN m.user_low=$2 THEN m.user_high ELSE m.user_low END AS recipient
      FROM appointments a JOIN matches m ON m.id=a.match_id WHERE a.id=$1 AND $2 IN (m.user_low,m.user_high)`,
    [appointmentId, req.userId]);
    if (!item) throw new AppError(404, 'Agendamento indisponível.');
    if (item.status !== 'concluido' || !item.ended) throw new AppError(409, 'A avaliação é liberada após a conclusão do encontro.');
    const review = await first(db, `INSERT INTO reviews (appointment_id,author_id,recipient_id,rating,comment)
      VALUES ($1,$2,$3,$4,$5) ON CONFLICT (appointment_id,author_id) DO NOTHING RETURNING *`,
    [appointmentId, req.userId, item.recipient, data.rating, data.comment || null]);
    if (!review) throw new AppError(409, 'Você já avaliou este encontro.');
    res.status(201).json(review);
  });
  return router;
}
