import { dbName } from '../src/config.js';
import { createPool, first } from '../src/db.js';
import { migrate } from './migrate.js';

const pool = createPool();

async function createDatabaseIfMissing() {
  try {
    await pool.query('SELECT 1');
    return;
  } catch (error) {
    if (error.code !== '3D000') throw error;
  }

  const maintenance = createPool({ database: 'postgres' });
  try {
    const database = await first(maintenance, 'SELECT quote_ident($1) AS identifier', [dbName]);
    await maintenance.query(`CREATE DATABASE ${database.identifier}`);
  } catch (error) {
    if (error.code !== '42P04') throw error;
  } finally {
    await maintenance.end();
  }
}

try {
  await createDatabaseIfMissing();
  await migrate(pool);
  console.log(`Banco ${dbName} preparado.`);
} catch (error) {
  if (error.code === '42501' || error.code === '3D000') {
    console.error('Peça a um administrador do PostgreSQL para criar o banco definido em PGDATABASE e atribuir a propriedade ao PGUSER. Depois execute npm run setup.');
  } else {
    console.error('Não foi possível preparar o banco de dados. Verifique o serviço e a configuração em .env.');
  }
  console.error(error.code || '', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
