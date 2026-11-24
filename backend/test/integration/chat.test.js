import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { io } from 'socket.io-client';
import { createApplication } from '../../src/app.js';
import { account, fixture } from '../helpers.js';

function waitEvent(target, name) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { target.off(name, handler); reject(new Error(`Evento não recebido: ${name}`)); }, 3000);
    const handler = value => { clearTimeout(timer); resolve(value); };
    target.once(name, handler);
  });
}

async function connect(t, base, cookie) {
  const socket = io(base, { autoConnect: false, forceNew: true, transports: ['websocket'], extraHeaders: cookie ? { Cookie: cookie } : {} });
  t.after(() => socket.disconnect());
  const connected = waitEvent(socket, cookie ? 'connect' : 'connect_error');
  socket.connect();
  return { socket, result: await connected };
}

test('Socket.IO autoriza a dupla, deduplica, registra leitura e recupera histórico após reinício', async t => {
  const { base, client, db, io: server } = await fixture(t);
  const ana = client(), bruno = client(), outsider = client();
  const [a, b] = await Promise.all([ana.send('/auth/register', 'POST', account('Ana')), bruno.send('/auth/register', 'POST', account('Bruno'))]);
  await outsider.send('/auth/register', 'POST', account('Clara'));
  const row = (await db.query('INSERT INTO matches (user_low,user_high) VALUES (least($1::int,$2::int),greatest($1::int,$2::int)) RETURNING id',
    [a.body.id, b.body.id])).rows[0];
  const matchId = row.id;
  const ack = (socket, event, data) => socket.timeout(3000).emitWithAck(event, data);
  const rejected = await connect(t, base);
  assert.equal(rejected.result.data.status, 401);
  const { socket: first } = await connect(t, base, ana.cookie);
  const { socket: second } = await connect(t, base, bruno.cookie);
  const { socket: third } = await connect(t, base, outsider.cookie);
  assert.equal((await ack(third, 'chat:join', { matchId })).status, 404);
  assert.equal((await ack(first, 'chat:join', { matchId })).data.online, true);
  assert.equal((await ack(second, 'chat:join', { matchId })).ok, true);
  const typing = waitEvent(second, 'chat:typing');
  assert.equal((await ack(first, 'chat:typing', { matchId, active: true })).ok, true);
  assert.equal((await typing).userId, a.body.id);

  const payload = { matchId, clientId: randomUUID(), content: 'Vamos trocar habilidades?' };
  const receive = waitEvent(second, 'chat:message');
  const [one, duplicate] = await Promise.all([ack(first, 'chat:send', payload), ack(first, 'chat:send', payload)]);
  assert.equal(one.ok, true);
  assert.equal(one.data.id, duplicate.data.id);
  assert.equal((await receive).content, payload.content);
  assert.equal((await ack(first, 'chat:send', { ...payload, content: 'Outro conteúdo' })).status, 409);
  assert.equal((await bruno.send('/matches')).body[0].unread, 1);
  const ids = [one.data.id];
  const delivered = waitEvent(first, 'chat:receipt');
  assert.equal((await ack(second, 'chat:delivered', { matchId, ids })).data.updated, 1);
  assert.ok((await delivered).messages[0].delivered_at);
  const receipt = waitEvent(first, 'chat:receipt');
  await ack(second, 'chat:read', { matchId, ids });
  assert.ok((await receipt).messages[0].read_at);
  assert.equal((await bruno.send('/matches')).body[0].unread, 0);

  const offline = waitEvent(first, 'chat:presence');
  second.disconnect();
  assert.equal((await offline).online, false);
  assert.equal((await ack(first, 'chat:send', { ...payload, clientId: randomUUID(), content: 'Mensagem durante desconexão' })).ok, true);

  first.disconnect();
  third.disconnect();
  await new Promise(resolve => server.close(resolve));
  const restarted = createApplication(db);
  t.after(() => new Promise(resolve => restarted.io.close(resolve)));
  restarted.server.listen(0, '127.0.0.1');
  await once(restarted.server, 'listening');
  const newBase = `http://127.0.0.1:${restarted.server.address().port}`;
  const recovered = await fetch(`${newBase}/api/matches/${matchId}/messages`, { headers: { cookie: bruno.cookie } });
  assert.deepEqual((await recovered.json()).messages.map(message => message.content),
    [payload.content, 'Mensagem durante desconexão']);
  const { socket: returned } = await connect(t, newBase, bruno.cookie);
  assert.equal((await ack(returned, 'chat:join', { matchId })).data.online, false);
  const ended = waitEvent(returned, 'auth:expired');
  const loggedOut = await fetch(`${newBase}/api/auth/logout`, { method: 'POST', headers: { cookie: bruno.cookie } });
  assert.equal(loggedOut.status, 204);
  await ended;
});
