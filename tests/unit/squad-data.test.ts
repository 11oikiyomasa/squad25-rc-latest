import test from 'node:test';
import assert from 'node:assert/strict';
import { members, normalizeYoutubeId } from '../../data/squad';

test('content normalization accepts a bare YouTube id', () => {
  assert.equal(normalizeYoutubeId('dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
});

test('content normalization accepts common YouTube URL forms', () => {
  assert.equal(normalizeYoutubeId('https://youtu.be/dQw4w9WgXcQ?t=12'), 'dQw4w9WgXcQ');
  assert.equal(normalizeYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(normalizeYoutubeId('youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(normalizeYoutubeId('https://www.youtube.com/embed/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
});

test('content normalization rejects malformed or unsupported URLs and empty values', () => {
  assert.equal(normalizeYoutubeId('not-video'), '');
  assert.equal(normalizeYoutubeId('https://example.com/watch?v=dQw4w9WgXcQ'), '');
  assert.equal(normalizeYoutubeId('https://youtube.com/watch?v=short'), '');
  assert.equal(normalizeYoutubeId(''), '');
});

test('seed roster remains deterministic and complete', () => {
  assert.equal(members.length, 25);
  assert.equal(new Set(members.map((member) => member.id)).size, members.length);
  assert.ok(members.every((member) => member.nickname && member.role && member.status));
});
