import { createHash, randomBytes } from 'node:crypto';
import { first } from '../db.js';
import { AppError } from '../http.js';

const name = 'if_swap_session';
const maxAge = 7 * 24 * 60 * 60 * 1000;
const options = { httpOnly: true, sameSite: 'lax', path: '/' };
const digest = token => createHash('sha256').update(token).digest('hex');

export function sessionHash(cookieHeader) {
  const token = cookieHeader?.match(/(?:^|;\s*)if_swap_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  return token ? digest(token) : null;
}

export async function sessionUser(db, hash) {
  if (!hash) throw new AppError(401, 'Entre para continuar.');
  const session = await first(db, 'SELECT user_id FROM sessions WHERE token_hash = $1 AND expires_at > now()', [hash]);
  if (!session) throw new AppError(401, 'Sua sessão expirou. Entre novamente.');
  return session.user_id;
}

export async function startSession(db, res, userId) {
  const token = randomBytes(32).toString('hex');
  await db.query('DELETE FROM sessions WHERE expires_at <= now()');
  await db.query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [digest(token), userId, new Date(Date.now() + maxAge)]);
  res.cookie(name, token, { ...options, maxAge });
}

export function requireSession(db) {
  return async (req, res, next) => {
    req.sessionHash = sessionHash(req.headers.cookie);
    req.userId = await sessionUser(db, req.sessionHash);
    next();
  };
}

export async function endSession(db, req, res) {
  const hash = sessionHash(req.headers.cookie);
  if (hash) await db.query('DELETE FROM sessions WHERE token_hash = $1', [hash]);
  res.clearCookie(name, options);
  return hash;
}
