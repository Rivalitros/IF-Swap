import { first, transaction } from '../db.js';
import { AppError } from '../http.js';

export async function challenges(db, status, before) {
  const { rows } = await db.query(`SELECT c.*, c.deadline::text AS deadline, c.deadline<current_date AS expired,
    u.name AS author_name,u.photo,
    (SELECT count(*)::int FROM challenge_replies r WHERE r.challenge_id=c.id AND r.status='ativa') AS reply_count
    FROM challenges c JOIN users u ON u.id=c.author_id
    WHERE ($1::text IS NULL OR c.status=$1) AND ($2::int IS NULL OR c.id<$2)
    ORDER BY c.id DESC LIMIT 31`, [status, before]);
  return { items: rows.slice(0, 30), next: rows.length > 30 ? rows[29].id : null };
}

export async function publish(db, userId, { description, deadline }) {
  const item = await first(db, `INSERT INTO challenges (author_id,description,deadline)
    SELECT $1,$2,$3::date WHERE $3::date>=current_date RETURNING id`, [userId, description, deadline]);
  if (!item) throw new AppError(400, 'Informe um prazo a partir de hoje.');
  return item;
}

export async function challengeReplies(db, challengeId) {
  if (!await first(db, 'SELECT 1 FROM challenges WHERE id=$1', [challengeId])) throw new AppError(404, 'Desafio indisponível.');
  const { rows } = await db.query(`SELECT r.*,u.name AS author_name,u.photo FROM challenge_replies r JOIN users u ON u.id=r.author_id
    WHERE r.challenge_id=$1 AND r.status='ativa' ORDER BY r.id`, [challengeId]);
  return rows;
}

export async function respond(db, userId, challengeId, { message, parentId }) {
  return transaction(db, async client => {
    const challenge = await first(client, 'SELECT status,deadline<current_date AS expired FROM challenges WHERE id=$1 FOR UPDATE', [challengeId]);
    if (!challenge) throw new AppError(404, 'Desafio indisponível.');
    if (challenge.status !== 'aberto' || challenge.expired) throw new AppError(409, 'O desafio está encerrado ou fora do prazo.');
    if (parentId && !await first(client, "SELECT 1 FROM challenge_replies WHERE challenge_id=$1 AND id=$2 AND status='ativa'", [challengeId, parentId])) {
      throw new AppError(404, 'Resposta indisponível neste desafio.');
    }
    return first(client, 'INSERT INTO challenge_replies (challenge_id,author_id,parent_id,message) VALUES ($1,$2,$3,$4) RETURNING *',
      [challengeId, userId, parentId ?? null, message]);
  });
}
