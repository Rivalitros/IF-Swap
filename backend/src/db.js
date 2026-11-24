import pg from 'pg';
import { dbName } from './config.js';

export function createPool(options = {}) {
  const pool = new pg.Pool({ database: dbName, connectionTimeoutMillis: 2000, ...options });
  pool.on('error', error => console.error('Conexão PostgreSQL interrompida:', error.code || error.message));
  return pool;
}

export async function transaction(pool, run) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await run(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function first(db, sql, values) {
  return (await db.query(sql, values)).rows[0];
}
