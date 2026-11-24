import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { first, transaction } from '../db.js';
import { AppError } from '../http.js';

export const uploads = new URL('../../uploads/', import.meta.url);

export function normalizeSkill(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

export async function addSkill(db, userId, kind, name) {
  const normalized = normalizeSkill(name);
  if (!normalized) throw new AppError(400, 'Informe uma habilidade válida.');
  return transaction(db, async client => {
    await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId]);
    const existing = await first(client, `SELECT s.id, s.name FROM user_skills us JOIN skills s ON s.id=us.skill_id
      WHERE us.user_id=$1 AND us.kind=$2 AND s.normalized_name=$3`, [userId, kind, normalized]);
    if (existing) return existing;
    const position = await first(client, `SELECT n AS slot FROM generate_series(1,5) n
      WHERE NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id=$1 AND kind=$2 AND slot=n)
      ORDER BY n LIMIT 1`, [userId, kind]);
    if (!position) throw new AppError(409, 'Você pode cadastrar até cinco habilidades por modalidade.');
    const skill = await first(client, `INSERT INTO skills (name, normalized_name) VALUES ($1,$2)
      ON CONFLICT (normalized_name) DO UPDATE SET normalized_name=EXCLUDED.normalized_name RETURNING id,name`, [name, normalized]);
    await client.query('INSERT INTO user_skills (user_id,skill_id,kind,slot) VALUES ($1,$2,$3,$4)',
      [userId, skill.id, kind, position.slot]);
    return skill;
  });
}

function imageExtension(file) {
  if (file?.mimetype === 'image/png' && file.buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return 'png';
  if (file?.mimetype === 'image/jpeg' && file.buffer.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'))) return 'jpg';
  if (file?.mimetype === 'image/webp' && file.buffer.toString('ascii', 0, 4) === 'RIFF'
      && file.buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  throw new AppError(400, 'Envie uma imagem PNG, JPEG ou WebP.');
}

export async function savePhoto(db, userId, file) {
  const filename = `${randomUUID()}.${imageExtension(file)}`;
  const target = new URL(filename, uploads);
  await mkdir(uploads, { recursive: true });
  await writeFile(target, file.buffer, { flag: 'wx' });
  let previous;
  try {
    previous = await transaction(db, async client => {
      const user = await first(client, 'SELECT photo FROM users WHERE id=$1 FOR UPDATE', [userId]);
      await client.query('UPDATE users SET photo=$2 WHERE id=$1', [userId, filename]);
      return user.photo;
    });
  } catch (error) {
    if (error.code && /^[0-9A-Z]{5}$/.test(error.code) && !error.code.startsWith('08')) {
      await unlink(target).catch(() => {});
    }
    throw error;
  }
  if (previous && /^[a-f0-9-]+\.(png|jpg|webp)$/.test(previous)) {
    await unlink(new URL(previous, uploads)).catch(() => {});
  }
}
