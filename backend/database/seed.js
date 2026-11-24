import { createPool, first, transaction } from '../src/db.js';
import { migrate } from './migrate.js';
import { hashPassword } from '../src/services/passwords.js';
import { readFile } from 'node:fs/promises';

const pool = createPool();
const sample = [
  ['Ana Lima', 'ana', 'Informática', 'aluno', 'Programação', 'Violão'],
  ['Bruno Costa', 'bruno', 'Biblioteca', 'funcionario', 'Violão', 'Programação'],
  ['Clara Alves', 'clara', 'Matemática', 'professor', 'Matemática', 'Inglês'],
  ['Diego Santos', 'diego', 'Informática', 'aluno', 'Inglês', 'Matemática'],
];

try {
  await migrate(pool);
  const hash = await hashPassword('TrocaLocal123!');
  const examples = await readFile(new URL('./seeds/demo.sql', import.meta.url), 'utf8');
  const inserted = await transaction(pool, async client => {
    await client.query('SELECT pg_advisory_xact_lock(129374, 2)');
    const emails = sample.map(([, email]) => `${email}@demo.invalid`);
    const existing = await client.query('SELECT 1 FROM users WHERE email = ANY($1)', [emails]);
    if (existing.rowCount) return false;

    for (const [name, username, department, affiliation, teach, learn] of sample) {
      const user = await first(client, `INSERT INTO users
        (name, email, department, affiliation, password_hash, onboarding_step)
        VALUES ($1, $2, $3, $4, $5, 4) RETURNING id`,
      [name, `${username}@demo.invalid`, department, affiliation, hash]);
      for (const [kind, skillName] of [['teach', teach], ['learn', learn]]) {
        const skill = await first(client, `INSERT INTO skills (name, normalized_name) VALUES ($1, $2)
          ON CONFLICT (normalized_name) DO UPDATE SET normalized_name = EXCLUDED.normalized_name RETURNING id`,
        [skillName, skillName.toLowerCase()]);
        await client.query('INSERT INTO user_skills (user_id, skill_id, kind, slot) VALUES ($1, $2, $3, 1)',
          [user.id, skill.id, kind]);
      }
    }
    await client.query(examples);
    return true;
  });
  console.log(inserted ? 'Dados demonstrativos criados.' : 'As contas demonstrativas já existem; seus dados foram preservados.');
} catch (error) {
  console.error(error.code || '', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
