import test from 'node:test';
import assert from 'node:assert/strict';
import { FALLBACK_MEMBER_IMAGE, isAllowedImageSource, safeImageSource } from '../../lib/image-sources';

test('image source helper accepts local and approved Supabase media URLs', () => {
  assert.equal(isAllowedImageSource('/images/members/ryuu.svg'), true);
  assert.equal(isAllowedImageSource('https://wyjsosamlkbwksrslona.supabase.co/storage/v1/object/public/squad-media/members/ryuu/file.webp'), true);
});

test('image source helper rejects arbitrary remote hosts and malformed values', () => {
  assert.equal(isAllowedImageSource('https://example.com/player.webp'), false);
  assert.equal(isAllowedImageSource('javascript:alert(1)'), false);
  assert.equal(isAllowedImageSource('not-a-url'), false);
  assert.equal(isAllowedImageSource(null), false);
});

test('image source helper returns deterministic fallback for unsafe values', () => {
  assert.equal(safeImageSource('/images/members/ryuu.svg'), '/images/members/ryuu.svg');
  assert.equal(safeImageSource('https://evil.example/player.webp'), FALLBACK_MEMBER_IMAGE);
});
