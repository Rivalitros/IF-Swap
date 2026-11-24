import { first, transaction } from '../db.js';
import { AppError } from '../http.js';
import { requireMatch } from './matching.js';

const participantSql = `SELECT a.*,m.user_low,m.user_high,
  json_build_object('id',u.id,'name',u.name,'department',u.department,'photo',u.photo) AS peer,
  EXISTS (SELECT 1 FROM reviews WHERE appointment_id=a.id AND author_id=$1) AS reviewed
  FROM appointments a JOIN matches m ON m.id=a.match_id
  JOIN users u ON u.id=CASE WHEN m.user_low=$1 THEN m.user_high ELSE m.user_low END`;

export async function agenda(db, userId) {
  const { rows } = await db.query(`${participantSql} WHERE $1 IN (m.user_low,m.user_high)
    ORDER BY a.starts_at DESC,a.id DESC`, [userId]);
  return rows;
}

export async function mutualInterest(db, a, b) {
  const result = await first(db, `SELECT count(DISTINCT own.kind)::int=2 AS mutual
    FROM user_skills own JOIN user_skills peer ON own.skill_id=peer.skill_id AND own.kind<>peer.kind
    JOIN users u1 ON own.user_id=u1.id JOIN users u2 ON peer.user_id=u2.id
    WHERE own.user_id=$1 AND peer.user_id=$2 AND u1.onboarding_step=4 AND u2.onboarding_step=4`, [a, b]);
  return result.mutual;
}

async function lockParticipants(db, ids) {
  await db.query('SELECT id FROM users WHERE id=ANY($1) ORDER BY id FOR UPDATE', [ids]);
}

async function reserve(db, ids, begin, end, except = null) {
  const overlap = await first(db, `SELECT 1 FROM appointments a JOIN matches m ON m.id=a.match_id
    WHERE (m.user_low=ANY($1) OR m.user_high=ANY($1)) AND a.status IN ('confirmado','em_andamento')
      AND a.starts_at<$3 AND a.ends_at>$2 AND ($4::integer IS NULL OR a.id<>$4) LIMIT 1`, [ids, begin, end, except]);
  if (overlap) throw new AppError(409, 'Um participante já tem um compromisso nesse horário.');
}

function requireFuture(start) {
  if (Date.parse(start) <= Date.now()) throw new AppError(409, 'Escolha um horário de início futuro.');
}

export async function propose(db, userId, data) {
  return transaction(db, async client => {
    const match = await requireMatch(client, userId, data.matchId);
    const ids = [match.user_low, match.user_high];
    await lockParticipants(client, ids);
    if (match.status !== 'active' || !await mutualInterest(client, ...ids)) {
      throw new AppError(409, 'O agendamento exige uma troca recíproca.');
    }
    requireFuture(data.startsAt);
    await reserve(client, ids, data.startsAt, data.endsAt);
    const item = await first(client, `INSERT INTO appointments (match_id,proposer_id,starts_at,ends_at,location,modality)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [match.id, userId, data.startsAt, data.endsAt, data.location, data.modality]);
    return { item, ids };
  });
}

const reversible = new Set(['pendente', 'confirmado']);
function checkAction(item, userId, action) {
  if (['accept', 'decline', 'change'].includes(action)) {
    if (item.status !== 'pendente') throw new AppError(409, 'Esta proposta já foi respondida.');
    if (item.proposer_id === userId) throw new AppError(403, 'Somente o outro participante pode responder.');
    if (action !== 'decline') requireFuture(item.starts_at);
  }
  if (action === 'cancel' && !reversible.has(item.status)) throw new AppError(409, 'Este encontro não pode mais ser cancelado.');
  const time = Date.now();
  if (action === 'start' && (item.status !== 'confirmado' || item.starts_at > time || item.ends_at <= time)) {
    throw new AppError(409, 'Inicie um encontro confirmado dentro do horário marcado.');
  }
  if (action === 'complete' && (!['confirmado', 'em_andamento'].includes(item.status) || item.ends_at > time)) {
    throw new AppError(409, 'A conclusão pode ser registrada após o horário do encontro.');
  }
}

const target = { accept: 'confirmado', decline: 'cancelado', cancel: 'cancelado', start: 'em_andamento', complete: 'concluido' };

export async function updateAppointment(db, userId, itemId, data) {
  return transaction(db, async client => {
    const {
      match_id: matchId, user_low: low, user_high: high,
    } = await first(client, `${participantSql} WHERE a.id=$2 AND $1 IN (m.user_low,m.user_high)`, [userId, itemId]) || {};
    if (!matchId) throw new AppError(404, 'Agendamento indisponível.');
    const ids = [low, high];
    await lockParticipants(client, ids);
    const current = await first(client, 'SELECT * FROM appointments WHERE id=$1 FOR UPDATE', [itemId]);
    checkAction(current, userId, data.action);
    let item;
    if (data.action === 'change') {
      requireFuture(data.startsAt);
      await reserve(client, ids, data.startsAt, data.endsAt, itemId);
      item = await first(client, `UPDATE appointments SET proposer_id=$2,starts_at=$3,ends_at=$4,
        location=$5,modality=$6,change_reason=$7 WHERE id=$1 RETURNING *`,
      [itemId, userId, data.startsAt, data.endsAt, data.location, data.modality, data.reason || null]);
    } else {
      if (data.action === 'accept') {
        if (!await mutualInterest(client, ...ids)) throw new AppError(409, 'O agendamento exige uma troca recíproca.');
        await reserve(client, ids, current.starts_at, current.ends_at, itemId);
      }
      item = await first(client, 'UPDATE appointments SET status=$2 WHERE id=$1 RETURNING *', [itemId, target[data.action]]);
    }
    return { item, ids };
  });
}

export async function completeEnded(db) {
  const { rows } = await db.query(`WITH completed AS (
    UPDATE appointments SET status='concluido'
    WHERE status IN ('confirmado','em_andamento') AND ends_at<=now() RETURNING *
  ) SELECT completed.*,m.user_low,m.user_high FROM completed JOIN matches m ON m.id=completed.match_id`);
  return rows.map(({ user_low, user_high, ...item }) => ({ item, ids: [user_low, user_high] }));
}
