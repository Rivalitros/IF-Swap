import assert from 'node:assert/strict';
import { test } from 'node:test';
import { account, fixture } from '../helpers.js';

test('cadastro, login, perfil e limite concorrente de habilidades', async t => {
  const { client, db } = await fixture(t);
  const browser = client();
  assert.equal((await browser.send('/health')).status, 200);
  assert.equal((await browser.send('/auth/me')).status, 401);
  const data = account('Ana');
  assert.equal((await browser.send('/auth/register', 'POST', { ...data, confirmation: 'diferente' })).status, 400);
  const registration = await browser.send('/auth/register', 'POST', data);
  assert.equal(registration.status, 201);
  assert.equal(registration.body.onboarding_step, 1);
  assert.equal((await browser.send('/auth/register', 'POST', data)).status, 409);
  const record = (await db.query('SELECT password_hash FROM users')).rows[0];
  assert.notEqual(record.password_hash, data.password);
  assert.equal((await browser.send('/auth/logout', 'POST')).status, 204);
  assert.equal((await browser.send('/auth/me')).status, 401);
  assert.equal((await browser.send('/auth/login', 'POST', { ...data, password: 'incorreta' })).status, 401);
  assert.equal((await browser.send('/auth/login', 'POST', data)).status, 200);
  const edit = await browser.send('/profile', 'PATCH', { ...data, department: 'Biblioteca', is_public: true });
  assert.equal(edit.body.department, 'Biblioteca');

  const additions = await Promise.all(Array.from({ length: 6 }, (_, i) =>
    browser.send('/profile/skills', 'POST', { kind: 'teach', name: `Área ${i}` })));
  assert.equal(additions.filter(result => result.status === 200).length, 5);
  assert.equal(additions.filter(result => result.status === 409).length, 1);
  const member = (await browser.send('/auth/me')).body;
  assert.equal(member.skills.teach.length, 5);
  const [skill] = member.skills.teach;
  assert.equal((await browser.send('/profile/skills', 'POST', { kind: 'learn', name: skill.name })).status, 200);
  assert.equal((await browser.send(`/profile/skills/teach/${skill.id}`, 'DELETE')).body.skills.teach.length, 4);
  assert.equal((await browser.send('/profile/advance', 'POST', { step: 2 })).body.onboarding_step, 1);
  for (const step of [1, 2, 3]) {
    assert.equal((await browser.send('/profile/advance', 'POST', { step })).body.onboarding_step, step + 1);
  }
});
