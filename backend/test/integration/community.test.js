import assert from 'node:assert/strict';
import { test } from 'node:test';
import { account, fixture } from '../helpers.js';

test('avaliação mútua pós-encontro, reputação e mural com réplicas', async t => {
  const { client, db } = await fixture(t);
  const ana = client(), bruno = client(), clara = client();
  const [a, b] = await Promise.all([ana.send('/auth/register', 'POST', account('Ana')), bruno.send('/auth/register', 'POST', account('Bruno'))]);
  await clara.send('/auth/register', 'POST', account('Clara'));
  const ids = [a.body.id, b.body.id];
  await db.query('UPDATE users SET onboarding_step=4 WHERE id=ANY($1)', [ids]);
  await ana.send('/profile/skills', 'POST', { kind: 'teach', name: 'Lógica' });
  await bruno.send('/profile/skills', 'POST', { kind: 'learn', name: 'Lógica' });
  const match = (await ana.send('/matches', 'POST', { userId: b.body.id })).body;
  const { rows: [meeting] } = await db.query(`INSERT INTO appointments
    (match_id,proposer_id,starts_at,ends_at,location,modality,status)
    VALUES ($1,$2,now()+interval '1 hour',now()+interval '2 hours','Biblioteca','presencial','confirmado') RETURNING id`,
  [match.id, a.body.id]);
  const path = `/agenda/${meeting.id}/reviews`;
  assert.equal((await ana.send(path, 'POST', { rating: 5 })).status, 409);
  assert.equal((await clara.send(path, 'POST', { rating: 5 })).status, 404);
  await db.query(`UPDATE appointments SET starts_at=now()-interval '2 hours', ends_at=now()-interval '1 hour' WHERE id=$1`, [meeting.id]);
  await bruno.send('/agenda');
  assert.equal((await ana.send(path, 'POST', { rating: 6 })).status, 400);

  const [first, second] = await Promise.all([
    ana.send(path, 'POST', { rating: 5, comment: 'Funcionou bem' }), bruno.send(path, 'POST', { rating: 4 }),
  ]);
  assert.equal(first.status, 201);
  assert.equal(first.body.recipient_id, b.body.id);
  assert.equal(second.status, 201);
  assert.equal((await ana.send(path, 'POST', { rating: 5 })).status, 409);
  const profile = (await ana.send('/users/' + b.body.id)).body;
  assert.equal(profile.reputation, 5);
  assert.equal(profile.review_count, 1);
  assert.equal(profile.rank, 1);
  assert.equal(profile.reviews[0].comment, 'Funcionou bem');
  assert.equal((await ana.send('/suggestions')).body[0].reputation, 5);

  const deadline = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
  const post = { description: 'Preciso praticar introdução à lógica.', deadline };
  assert.equal((await ana.send('/challenges', 'POST', { ...post, deadline: '2000-01-01' })).status, 400);
  const result = await ana.send('/challenges', 'POST', post);
  assert.equal(result.status, 201);
  const challenge = '/challenges/' + result.body.id;
  const other = (await ana.send('/challenges', 'POST', post)).body.id;
  const root = await bruno.send(challenge + '/replies', 'POST', { message: 'Posso sugerir exercícios.' });
  assert.equal(root.status, 201);
  assert.equal((await clara.send('/challenges/' + other + '/replies', 'POST', { parentId: root.body.id, message: 'Outro tópico.' })).status, 404);
  const nested = await ana.send(challenge + '/replies', 'POST', { parentId: root.body.id, message: 'Muito obrigada!' });
  assert.equal(nested.body.parent_id, root.body.id);
  assert.equal((await clara.send(challenge + '/replies')).body.length, 2);
  assert.equal((await bruno.send(challenge + '/close', 'PATCH')).status, 404);
  assert.equal((await ana.send(challenge + '/close', 'PATCH')).body.status, 'encerrado');
  assert.equal((await bruno.send(challenge + '/replies', 'POST', { message: 'Cheguei tarde.' })).status, 409);
  assert.deepEqual((await ana.send('/challenges?status=encerrado')).body.items.map(item => item.id), [result.body.id]);
});
