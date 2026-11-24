import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { createApplication } from '../src/app.js';
import { createPool } from '../src/db.js';

export async function fixture(t) {
  if (!process.env.TEST_DATABASE_URL) throw new Error('Defina TEST_DATABASE_URL para um banco PostgreSQL local de testes.');
  const url = new URL(process.env.TEST_DATABASE_URL);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || !url.pathname.endsWith('_test')) {
    throw new Error('Use um banco local com nome terminado em _test.');
  }
  const schema = 'if_swap_' + randomBytes(8).toString('hex');
  const admin = createPool({ connectionString: url.href, options: '-c search_path=public' });
  t.after(() => admin.end());
  await admin.query(`CREATE SCHEMA ${schema}`);
  const db = createPool({ connectionString: url.href, options: `-c search_path=${schema}` });
  t.after(async () => {
    await db.end();
    const cleanup = createPool({ connectionString: url.href });
    try { await cleanup.query(`DROP SCHEMA ${schema} CASCADE`); }
    finally { await cleanup.end(); }
  });

  const application = createApplication(db);
  async function boot() {
    application.server.listen(0, '127.0.0.1');
    await once(application.server, 'listening');
    return `http://127.0.0.1:${application.server.address().port}`;
  }
  const base = await boot();
  t.after(() => new Promise(resolve => {
    if (application.io) application.io.close(resolve);
    else application.server.close(resolve);
  }));

  function client(currentBase = base) {
    let cookie;
    return {
      get cookie() { return cookie; },
      async send(path, method = 'GET', body) {
        const isJson = body !== undefined && !(body instanceof FormData);
        const headers = {};
        if (cookie) headers.cookie = cookie;
        if (isJson) headers['Content-Type'] = 'application/json';
        const response = await fetch(currentBase + '/api' + path, { method, headers, body: isJson ? JSON.stringify(body) : body });
        cookie = response.headers.get('set-cookie')?.split(';')[0] || cookie;
        return { status: response.status, body: await response.json().catch(() => null) };
      },
    };
  }
  return { ...application, db, base, client };
}

export function account(name) {
  return { name, email: `${name.toLowerCase()}@demo.invalid`, password: 'TrocaTeste123!', confirmation: 'TrocaTeste123!', affiliation: 'aluno', department: 'Informática' };
}
