import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { io } from 'socket.io-client';
import { createServer } from 'vite';
import { account, fixture } from '../../backend/test/helpers.js';

async function openProxy(t, backend) {
  // loadEnv in vite.config.js gives these overrides precedence over the local .env.
  process.env.PORT = new URL(backend).port;
  process.env.WEB_HOST = '127.0.0.1';
  const web = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    server: { port: 0, watch: null },
    logLevel: 'silent',
  });
  t.after(() => web.close());
  await web.listen();
  return `http://127.0.0.1:${web.httpServer.address().port}`;
}

const waitFor = async (socket, event) => (await once(socket, event, { signal: AbortSignal.timeout(5000) }))[0];

async function connect(socket) {
  const connected = waitFor(socket, 'connect');
  socket.connect();
  await connected;
}

test('Vite encaminha sessão, WebSocket, histórico e agenda pela mesma origem', async t => {
  const { base, client } = await fixture(t);
  const origin = await openProxy(t, base);
  const health = await fetch(`${origin}/api/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok', database: 'online' });

  const ana = client(origin);
  const bruno = client(origin);
  async function signIn(browser, name, teach, learn) {
    const profile = account(name);
    assert.equal((await browser.send('/auth/register', 'POST', profile)).status, 201);
    const login = await browser.send('/auth/login', 'POST', { email: profile.email, password: profile.password });
    assert.equal(login.status, 200);
    assert.equal((await browser.send('/profile/skills', 'POST', { kind: 'teach', name: teach })).status, 200);
    assert.equal((await browser.send('/profile/skills', 'POST', { kind: 'learn', name: learn })).status, 200);
    for (const step of [1, 2, 3]) {
      assert.equal((await browser.send('/profile/advance', 'POST', { step })).status, 200);
    }
    return login.body.id;
  }
  await signIn(ana, 'Ana', 'Programação', 'Violão');
  const peerId = await signIn(bruno, 'Bruno', 'Violão', 'Programação');
  const match = await ana.send('/matches', 'POST', { userId: peerId });
  assert.equal(match.status, 200);
  const matchId = match.body.id;

  function createSocket(browser) {
    const socket = io(origin, {
      autoConnect: false,
      forceNew: true,
      transports: ['websocket'],
      extraHeaders: { Origin: origin, Cookie: browser.cookie },
    });
    t.after(() => socket.disconnect());
    return socket;
  }
  const first = createSocket(ana);
  const second = createSocket(bruno);
  await Promise.all([connect(first), connect(second)]);

  const payload = { matchId, clientId: randomUUID(), content: 'Vamos estudar na biblioteca?' };
  const [received, sent] = await Promise.all([
    waitFor(second, 'chat:message'),
    first.timeout(5000).emitWithAck('chat:send', payload),
  ]);
  assert.equal(sent.ok, true);
  assert.equal(received.id, sent.data.id);
  assert.equal(received.content, payload.content);

  second.disconnect();
  const offline = await first.timeout(5000).emitWithAck('chat:send', {
    ...payload, clientId: randomUUID(), content: 'A sala de estudos também está livre.',
  });
  assert.equal(offline.ok, true);
  await connect(second);
  const history = await bruno.send(`/matches/${matchId}/messages`);
  assert.equal(history.status, 200);
  assert.deepEqual(history.body.messages.map(message => message.id), [received.id, offline.data.id]);

  const startsAt = Date.now() + 86_400_000;
  const [proposed, appointment] = await Promise.all([
    waitFor(second, 'agenda:update'),
    ana.send('/agenda', 'POST', {
      matchId, startsAt: new Date(startsAt).toISOString(), endsAt: new Date(startsAt + 3_600_000).toISOString(),
      location: 'Biblioteca', modality: 'presencial',
    }),
  ]);
  assert.equal(appointment.status, 201);
  assert.equal(proposed.id, appointment.body.id);
  const [confirmed, acceptance] = await Promise.all([
    waitFor(first, 'agenda:update'),
    bruno.send(`/agenda/${proposed.id}`, 'PATCH', { action: 'accept' }),
  ]);
  assert.equal(acceptance.status, 200);
  assert.deepEqual(confirmed, { id: proposed.id, matchId, status: 'confirmado' });
  for (const browser of [ana, bruno]) {
    const agenda = await browser.send('/agenda');
    assert.equal(agenda.status, 200);
    assert.equal(agenda.body.find(item => item.id === proposed.id)?.status, 'confirmado');
  }
});
