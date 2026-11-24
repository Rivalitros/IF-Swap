import assert from 'node:assert/strict';
import { test } from 'node:test';
import { io } from 'socket.io-client';
import { account, fixture } from '../helpers.js';

test('agenda exige reciprocidade, protege a dupla e reserva intervalos sem conflito', async t => {
  const { client, db, base } = await fixture(t);
  const ana = client(), bruno = client(), carla = client();
  async function register(browser, name, teach, learn) {
    const { body } = await browser.send('/auth/register', 'POST', account(name));
    await browser.send('/profile/skills', 'POST', { kind: 'teach', name: teach });
    if (learn) await browser.send('/profile/skills', 'POST', { kind: 'learn', name: learn });
    await db.query('UPDATE users SET onboarding_step=4 WHERE id=$1', [body.id]);
    return body.id;
  }
  const anaId = await register(ana, 'Ana', 'Programação', 'Violão');
  const brunoId = await register(bruno, 'Bruno', 'Violão', 'Programação');
  const carlaId = await register(carla, 'Carla', 'Violão');
  const reciprocal = (await ana.send('/matches', 'POST', { userId: brunoId })).body.id;
  const oneWay = (await ana.send('/matches', 'POST', { userId: carlaId })).body.id;
  const body = { matchId: reciprocal, startsAt: new Date(Date.now() + 86400_000).toISOString(),
    endsAt: new Date(Date.now() + 90000_000).toISOString(), location: 'Biblioteca', modality: 'presencial' };
  assert.equal((await ana.send('/agenda', 'POST', { ...body, matchId: oneWay })).status, 409);
  assert.equal((await carla.send('/agenda', 'POST', body)).status, 404);

  const socket = io(base, { autoConnect: false, forceNew: true, transports: ['websocket'], extraHeaders: { Cookie: bruno.cookie } });
  t.after(() => socket.disconnect());
  const event = name => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Evento ausente: ' + name)), 3000);
    socket.once(name, payload => { clearTimeout(timeout); resolve(payload); });
  });
  const connected = event('connect');
  socket.connect();
  await connected;
  const announced = event('agenda:update');
  const first = await ana.send('/agenda', 'POST', body);
  assert.equal(first.status, 201);
  assert.equal((await announced).id, first.body.id);
  const firstUrl = '/agenda/' + first.body.id;
  assert.equal((await ana.send(firstUrl, 'PATCH', { action: 'accept' })).status, 403);
  assert.equal((await carla.send(firstUrl, 'PATCH', { action: 'accept' })).status, 404);
  const revised = await bruno.send(firstUrl, 'PATCH', { ...body, action: 'change', location: 'Sala de estudos', reason: 'Biblioteca fechada' });
  assert.equal(revised.body.proposer_id, brunoId);
  assert.equal(revised.body.location, 'Sala de estudos');
  assert.equal((await bruno.send(firstUrl, 'PATCH', { action: 'accept' })).status, 403);
  const second = await ana.send('/agenda', 'POST', body);
  const confirmations = await Promise.all([ana.send(firstUrl, 'PATCH', { action: 'accept' }),
    bruno.send('/agenda/' + second.body.id, 'PATCH', { action: 'accept' })]);
  assert.deepEqual(confirmations.map(response => response.status).sort(), [200, 409]);
  assert.equal((await ana.send('/agenda', 'POST', body)).status, 409);
  const listing = (await bruno.send('/agenda')).body;
  const confirmed = listing.find(item => item.status === 'confirmado');
  const pending = listing.find(item => item.status === 'pendente');
  assert.equal(confirmed.peer.id, anaId);
  assert.equal((await bruno.send('/agenda/' + confirmed.id, 'PATCH', { action: 'complete' })).status, 409);
  await db.query("UPDATE appointments SET starts_at=now()-interval '2 hours', ends_at=now()-interval '1 hour' WHERE id=$1", [confirmed.id]);
  assert.equal((await ana.send('/agenda')).body.find(item => item.id === confirmed.id).status, 'concluido');
  assert.equal((await ana.send('/agenda/' + pending.id, 'PATCH', { action: 'cancel' })).body.status, 'cancelado');
});
