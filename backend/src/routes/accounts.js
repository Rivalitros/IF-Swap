import { Router } from 'express';
import { z } from 'zod';
import { first } from '../db.js';
import { AppError, text } from '../http.js';
import { currentProfile } from '../repositories/users.js';
import { hashPassword, verifyPassword } from '../services/passwords.js';
import { endSession, requireSession, startSession } from '../services/sessions.js';

export const profileFields = {
  name: text(100, 2), department: text(100, 2),
  affiliation: z.enum(['aluno', 'professor', 'funcionario']),
};
const credentials = z.object({
  email: z.email().max(254).transform(value => value.toLowerCase()),
  password: z.string().min(8).max(128),
});
const registration = credentials.extend({
  ...profileFields, confirmation: z.string(),
}).refine(data => data.password === data.confirmation, { path: ['confirmation'] });

export function accountRoutes(db, onLogout) {
  const router = Router();

  router.post('/register', async (req, res) => {
    const data = registration.parse(req.body);
    const user = await first(db, `INSERT INTO users (name, email, password_hash, department, affiliation)
      VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING RETURNING id`,
    [data.name, data.email, await hashPassword(data.password), data.department, data.affiliation]);
    if (!user) throw new AppError(409, 'Já existe uma conta com este e-mail.');
    await startSession(db, res, user.id);
    res.status(201).json(await currentProfile(db, user.id));
  });

  router.post('/login', async (req, res) => {
    const { email, password } = credentials.parse(req.body);
    const user = await first(db, 'SELECT id, password_hash FROM users WHERE email = $1', [email]);
    if (!await verifyPassword(password, user?.password_hash)) throw new AppError(401, 'E-mail ou senha incorretos.');
    await startSession(db, res, user.id);
    res.json(await currentProfile(db, user.id));
  });

  router.post('/logout', async (req, res) => {
    const hash = await endSession(db, req, res);
    if (hash) onLogout(hash);
    res.sendStatus(204);
  });

  router.get('/me', requireSession(db), async (req, res) => res.json(await currentProfile(db, req.userId)));
  return router;
}
