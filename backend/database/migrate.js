import { readFile, readdir } from 'node:fs/promises';
import { transaction } from '../src/db.js';

const directory = new URL('./migrations/', import.meta.url);

export async function migrate(pool) {
  const files = (await readdir(directory)).filter(file => /^\d+_.+\.sql$/.test(file)).sort();
  await transaction(pool, async client => {
    await client.query('SELECT pg_advisory_xact_lock(129374, 1)');
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const applied = new Set((await client.query('SELECT name FROM schema_migrations')).rows.map(row => row.name));
    for (const file of files) {
      if (applied.has(file)) continue;
      await client.query(await readFile(new URL(file, directory), 'utf8'));
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
    }
  });
}
