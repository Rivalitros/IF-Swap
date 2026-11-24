import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { account, fixture } from '../helpers.js';

test('migração do seed reconcilia chaves antigas e novas sem perder habilidades', async t => {
  const { client, db } = await fixture(t);
  const a = client(), b = client();
  const [first, second] = await Promise.all([
    a.send('/auth/register', 'POST', account('Ana')),
    b.send('/auth/register', 'POST', account('Bruno')),
  ]);
  const aId = first.body.id, bId = second.body.id;
  const canonical = (await a.send('/profile/skills', 'POST', { kind: 'teach', name: 'Programação' })).body.skills.teach[0].id;
  const { rows: [old] } = await db.query("INSERT INTO skills (name, normalized_name) VALUES ('Programação', 'programação') RETURNING id");
  await db.query(`INSERT INTO user_skills (user_id,skill_id,kind,slot) VALUES
    ($1,$3,'teach',2), ($2,$3,'learn',1)`, [aId, bId, old.id]);

  await db.query(await readFile(new URL('../../database/migrations/002_normalize_demo_skills.sql', import.meta.url), 'utf8'));
  assert.deepEqual((await a.send('/auth/me')).body.skills.teach.map(skill => skill.id), [canonical]);
  assert.deepEqual((await b.send('/auth/me')).body.skills.learn.map(skill => skill.id), [canonical]);
  assert.equal((await db.query("SELECT id FROM skills WHERE normalized_name='programação'")).rowCount, 0);
});
