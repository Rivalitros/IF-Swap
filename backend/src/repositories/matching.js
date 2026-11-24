import { first, transaction } from '../db.js';
import { AppError } from '../http.js';
import { publicFields, skillsFor } from './users.js';

const reputationSql = `SELECT round(avg(rating), 1)::float AS reputation, count(*)::int AS review_count
  FROM reviews WHERE recipient_id = u.id`;

export async function suggestions(db, userId, search = '', target = null) {
  const { rows } = await db.query(`WITH compatible_skills AS (
    SELECT other.user_id, own.kind, array_agg(s.name ORDER BY s.name) AS names
    FROM user_skills own JOIN user_skills other ON other.skill_id=own.skill_id AND other.kind<>own.kind
    JOIN skills s ON s.id=own.skill_id
    WHERE own.user_id=$1 AND other.user_id<>$1
    GROUP BY other.user_id, own.kind
  )
  SELECT u.id,u.name,u.department,u.affiliation,u.photo,r.*, skills.learn,
    COALESCE(l.names, ARRAY[]::text[]) AS can_learn, COALESCE(t.names, ARRAY[]::text[]) AS can_teach
  FROM users u
  LEFT JOIN compatible_skills l ON l.user_id=u.id AND l.kind='learn'
  LEFT JOIN compatible_skills t ON t.user_id=u.id AND t.kind='teach'
  CROSS JOIN LATERAL (${reputationSql}) r
  CROSS JOIN LATERAL (
    SELECT ARRAY(SELECT s.name FROM user_skills us JOIN skills s ON s.id=us.skill_id
      WHERE us.user_id=u.id AND us.kind='learn' ORDER BY us.slot) AS learn
  ) skills
  WHERE u.is_public AND u.onboarding_step=4 AND (l.user_id IS NOT NULL OR t.user_id IS NOT NULL)
    AND ($3::integer IS NULL OR u.id=$3)
    AND ($2 = '' OR strpos(lower(u.name || ' ' || u.department),lower($2))>0
      OR EXISTS (SELECT 1 FROM user_skills us JOIN skills s ON s.id=us.skill_id
        WHERE us.user_id=u.id AND strpos(lower(s.name),lower($2))>0))
  ORDER BY (l.user_id IS NOT NULL AND t.user_id IS NOT NULL) DESC,
    COALESCE(cardinality(l.names),0) + COALESCE(cardinality(t.names),0) DESC,
    r.reputation DESC NULLS LAST, u.name, u.id
  LIMIT 100`, [userId, search, target]);
  return rows.map(row => ({ ...row, reciprocal: Boolean(row.can_learn.length && row.can_teach.length) }));
}

export async function publicProfile(db, viewer, target) {
  const user = await first(db, `SELECT ${publicFields}, r.* FROM users u
    CROSS JOIN LATERAL (${reputationSql}) r
    WHERE u.id=$2 AND (u.id=$1 OR (u.is_public AND u.onboarding_step=4))`, [viewer, target]);
  if (!user) throw new AppError(404, 'Perfil indisponível.');
  const { rows: reviews } = await db.query(`SELECT r.id, r.rating, r.comment, r.created_at, u.name AS author
    FROM reviews r JOIN users u ON u.id=r.author_id WHERE r.recipient_id=$1 ORDER BY r.id DESC LIMIT 50`, [target]);
  const ranking = await first(db, `WITH ranking AS (
    SELECT u.id, dense_rank() OVER (ORDER BY avg(r.rating) DESC, count(*) DESC)::int AS rank
    FROM reviews r JOIN users u ON u.id=r.recipient_id
    WHERE u.is_public AND u.onboarding_step=4 GROUP BY u.id
  ) SELECT rank FROM ranking WHERE id=$1`, [target]);
  return { ...user, skills: await skillsFor(db, target), reviews, rank: ranking?.rank ?? null };
}

export async function ensureMatch(db, user, other) {
  if (user === other) throw new AppError(400, 'Escolha outra pessoa.');
  const pair = [user, other].sort((a, b) => a - b);
  return transaction(db, async client => {
    const current = await first(client, 'SELECT * FROM matches WHERE user_low=$1 AND user_high=$2', pair);
    if (current) return current;
    if (!(await suggestions(client, user, '', other)).length) throw new AppError(404, 'Sugestão compatível indisponível.');
    return first(client, `INSERT INTO matches (user_low,user_high) VALUES ($1,$2)
      ON CONFLICT (user_low,user_high) DO UPDATE SET user_low=EXCLUDED.user_low RETURNING *`, pair);
  });
}

export async function requireMatch(db, userId, matchId) {
  const match = await first(db, 'SELECT * FROM matches WHERE id=$1 AND $2 IN (user_low,user_high)', [matchId, userId]);
  if (!match) throw new AppError(404, 'Conversa indisponível.');
  return { ...match, peerId: match.user_low === userId ? match.user_high : match.user_low };
}
