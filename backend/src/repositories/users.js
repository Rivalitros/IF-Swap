import { first } from '../db.js';

export const publicFields = 'id, name, department, affiliation, photo, is_public';
export const privateFields = `${publicFields}, email, onboarding_step`;

export async function skillsFor(db, userId) {
  const result = await db.query(`SELECT s.id, s.name, us.kind FROM user_skills us
    JOIN skills s ON s.id = us.skill_id WHERE us.user_id = $1 ORDER BY us.kind, us.slot`, [userId]);
  return {
    teach: result.rows.filter(row => row.kind === 'teach'),
    learn: result.rows.filter(row => row.kind === 'learn'),
  };
}

export async function currentProfile(db, userId) {
  const user = await first(db, `SELECT ${privateFields} FROM users WHERE id = $1`, [userId]);
  return { ...user, skills: await skillsFor(db, userId) };
}
