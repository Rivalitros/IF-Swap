import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hashPassword, verifyPassword } from '../src/services/passwords.js';
import { normalizeSkill } from '../src/services/profile.js';

test('scrypt usa salt por senha e valida credenciais', async () => {
  const first = await hashPassword('senha de teste');
  const second = await hashPassword('senha de teste');
  assert.notEqual(first, second);
  assert.equal(await verifyPassword('senha de teste', first), true);
  assert.equal(await verifyPassword('outra senha', first), false);
});

test('normalização de habilidades considera acentos, espaços e caixa', () => {
  assert.equal(normalizeSkill('  LÓGICA   matemática '), 'logica matematica');
});
