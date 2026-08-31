import test from 'node:test';
import assert from 'node:assert/strict';
import { safeNext } from '../../lib/auth-helpers.ts';

test('safeNext accepts a local path', () => {
  assert.equal(safeNext('/admin/recruitment'), '/admin/recruitment');
});

test('safeNext rejects protocol-relative open redirects', () => {
  assert.equal(safeNext('//evil.example/path'), '/admin');
});

test('safeNext rejects absolute and non-string targets', () => {
  assert.equal(safeNext('https://evil.example'), '/admin');
  assert.equal(safeNext(null), '/admin');
});
