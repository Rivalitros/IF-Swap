import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';

try {
  loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

export const host = process.env.HOST || '127.0.0.1';
export const port = Number(process.env.PORT || 3001);
export const dbName = process.env.PGDATABASE || 'if_swap';
