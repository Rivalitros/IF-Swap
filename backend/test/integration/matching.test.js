import assert from 'node:assert/strict';
import { test } from 'node:test';
import { account, fixture } from '../helpers.js';

test('matching recíproco tem prioridade e cada par tem uma conversa', async t => {
  const { db, client } = await fixture(t);
  const ana = client(), bruno = client(), clara = client();
  const register = async (browser, name, skills) => {
    const result = await browser.send('/auth/register', 'POST', account(name));
    assert.equal(result.status, 201);
    for (const [kind, name] of Object.entries(skills)) {
      assert.equal((await browser.send('/profile/skills', 'POST', { kind, name })).status, 200);
    }
    await db.query('UPDATE users SET onboarding_step=4 WHERE id=$1', [result.body.id]);
    return result.body.id;
  };
  const anaId = await register(ana, 'Ana', { teach: 'Programação', learn: 'Violão' });
  const brunoId = await register(bruno, 'Bruno', { teach: 'VIOLAO', learn: 'programacao' });
  const claraId = await register(clara, 'Clara', { teach: 'Violão' });
  const list = await ana.send('/suggestions');
  assert.deepEqual(list.body.map(item => [item.id, item.reciprocal]), [[brunoId, true], [claraId, false]]);
  assert.deepEqual((await ana.send('/suggestions?q=Bruno')).body.map(item => item.id), [brunoId]);
  const [one, two] = await Promise.all([ana.send('/matches', 'POST', { userId: brunoId }), bruno.send('/matches', 'POST', { userId: anaId })]);
  assert.equal(one.status, 200);
  assert.equal(one.body.id, two.body.id);
  assert.equal((await clara.send(`/matches/${one.body.id}`)).status, 404);
  await bruno.send('/profile', 'PATCH', { ...account('Bruno'), is_public: false });
  assert.equal((await ana.send(`/users/${brunoId}`)).status, 404);
  assert.deepEqual((await ana.send('/suggestions')).body.map(item => item.id), [claraId]);
});
