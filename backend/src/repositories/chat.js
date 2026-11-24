import { first, transaction } from '../db.js';
import { AppError } from '../http.js';
import { requireMatch } from './matching.js';

export async function conversations(db, userId) {
  const { rows } = await db.query(`SELECT m.id,m.created_at,
    json_build_object('id',u.id,'name',u.name,'department',u.department,'photo',u.photo) AS peer,
    lm.content AS last_message,lm.created_at AS last_at, unread.total AS unread
    FROM matches m JOIN users u ON u.id=CASE WHEN m.user_low=$1 THEN m.user_high ELSE m.user_low END
    LEFT JOIN LATERAL (SELECT content, created_at FROM messages WHERE match_id=m.id ORDER BY id DESC LIMIT 1) lm ON true
    CROSS JOIN LATERAL (SELECT count(*)::int AS total FROM messages
      WHERE match_id=m.id AND sender_id<>$1 AND read_at IS NULL) unread
    WHERE $1 IN (m.user_low,m.user_high) AND m.status='active'
    ORDER BY COALESCE(lm.created_at,m.created_at) DESC,m.id DESC`, [userId]);
  return rows;
}

export async function history(db, userId, matchId, before) {
  await requireMatch(db, userId, matchId);
  const { rows } = await db.query(`SELECT * FROM messages WHERE match_id=$1 AND ($2::int IS NULL OR id<$2)
    ORDER BY id DESC LIMIT 51`, [matchId, before]);
  const messages = rows.slice(0, 50);
  return { messages: messages.reverse(), next: rows.length > 50 ? rows[49].id : null };
}

export async function storeMessage(db, userId, { matchId, clientId, content }) {
  return transaction(db, async client => {
    const match = await requireMatch(client, userId, matchId);
    if (match.status !== 'active') throw new AppError(409, 'A conversa está encerrada.');
    const inserted = await first(client, `INSERT INTO messages (match_id,sender_id,client_id,content)
      VALUES ($1,$2,$3,$4) ON CONFLICT (match_id,sender_id,client_id) DO NOTHING RETURNING *`,
    [matchId, userId, clientId, content]);
    const message = inserted || await first(client,
      'SELECT * FROM messages WHERE match_id=$1 AND sender_id=$2 AND client_id=$3', [matchId, userId, clientId]);
    if (message.content !== content) throw new AppError(409, 'Identificador já usado para outra mensagem.');
    return { message, inserted: Boolean(inserted), peerId: match.peerId };
  });
}

export async function receipt(db, userId, { matchId, ids }, mode) {
  const match = await requireMatch(db, userId, matchId);
  const reading = mode === 'read';
  const { rows } = await db.query(`UPDATE messages
    SET delivered_at=COALESCE(delivered_at, now()),read_at=CASE WHEN $4 THEN now() ELSE read_at END
    WHERE match_id=$1 AND sender_id<>$2 AND id=ANY($3)
      AND CASE WHEN $4 THEN read_at IS NULL ELSE delivered_at IS NULL END
    RETURNING id,match_id,delivered_at,read_at`, [matchId, userId, ids, reading]);
  return { rows, peerId: match.peerId };
}
