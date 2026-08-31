import test from 'node:test';
import assert from 'node:assert/strict';

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

async function get(path: string) {
  return fetch(new URL(path, baseUrl));
}

test('public API content contract is reachable', async () => {
  const response = await get('/api/content');
  assert.equal(response.ok, true);
  const payload = await response.json() as { members?: unknown[]; profile?: unknown };
  assert.ok(payload.profile);
  assert.ok(Array.isArray(payload.members));
  assert.equal(payload.members.length, 25);
});

test('admin recruitment API never becomes public', async () => {
  const response = await get('/api/admin/recruitment');
  assert.ok([401, 403, 503].includes(response.status));
});

test('health endpoint returns an explicit service state', async () => {
  const response = await get('/api/health');
  assert.ok([200, 503].includes(response.status));
});
