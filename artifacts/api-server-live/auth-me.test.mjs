import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source = await fs.readFile(new URL('./index.mjs', import.meta.url), 'utf8');
const start = source.indexOf('router2.get("/auth/me",');
const end = source.indexOf('router2.get("/auth/profile",', start);
assert.ok(start > 0 && end > start);

async function getMe(rows) {
  let handler;
  vm.runInNewContext(source.slice(start, end), {
    router2: { get: (_path, _auth, route) => { handler = route; } },
    authMiddleware() {},
    mysql_default: { query: async (_sql, parameters) => {
      assert.deepEqual(Array.from(parameters), ['fixture-member']);
      return [rows];
    } },
  });
  const result = { status: 200, body: null };
  const response = {
    status(code) { result.status = code; return this; },
    json(body) { result.body = body; },
  };
  await handler({ user: { mb_id: 'fixture-member', mb_level: 2 } }, response);
  return result;
}

test('a deleted member cannot restore a native session from an old token', async () => {
  const result = await getMe([]);
  assert.equal(result.status, 401);
  assert.equal(result.body.mb_id, undefined);
  assert.ok(result.body.error);
});

test('an existing member keeps the flat profile contract used at app startup', async () => {
  const result = await getMe([{ mb_id: 'fixture-member', mb_name: '確認', mb_level: 2, mb_point: '0' }]);
  assert.equal(result.status, 200);
  assert.equal(result.body.mb_id, 'fixture-member');
  assert.equal(result.body.is_approved, true);
  assert.equal(result.body.is_admin, false);
  assert.equal(result.body.mb_point, 0);
});
