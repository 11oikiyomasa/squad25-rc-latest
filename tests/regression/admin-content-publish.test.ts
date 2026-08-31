import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const escaped = (value: string) => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

test('regression: admin publish cannot silently drop achievements or gallery', () => {
  const route = read('app/api/admin/content/route.ts');
  const migration = read('supabase/migrations/20260831063302_harden_publish_snapshot.sql');
  for (const token of ['const achievements = candidate.achievements', 'const gallery = candidate.gallery', 'achievements: normalizedAchievements', 'gallery: normalizedGallery']) assert.match(route, escaped(token));
  for (const token of ['jsonb_typeof(payload->\'achievements\')', 'jsonb_typeof(payload->\'gallery\')', 'delete from achievements', 'delete from gallery_items']) assert.match(migration, escaped(token));
});

test('regression: admin media route is a real media editor', () => {
  const page = read('app/admin/media/page.tsx');
  assert.match(page, /AdminMediaStudio/);
  const component = read('components/admin-media-studio.tsx');
  assert.match(component, /Gallery archive/);
  assert.match(component, /Achievements/);
  assert.match(component, /const DRAFT_KEY = 'squad25-content-v1'/);
  assert.match(component, /const PUBLISHED_KEY = 'squad25-published-v1'/);
  assert.match(component, /fetch\('\/api\/admin\/content'/);
});

test('regression: roster and overview use the hardened content studio and preserve unsaved drafts', () => {
  const overview = read('app/admin/overview/page.tsx');
  const roster = read('app/admin/roster/page.tsx');
  const studio = read('components/admin-studio-v2.tsx');
  assert.match(overview, /AdminStudioV2/);
  assert.match(roster, /AdminStudioV2/);
  assert.match(studio, /const DRAFT_KEY = 'squad25-content-v1'/);
  assert.match(studio, /const PUBLISHED_KEY = 'squad25-published-v1'/);
  assert.match(studio, /serializedDraft && \(!currentPublished \|\| serializedDraft !== currentPublished\)/);
});

test('regression: published image sources must match next/image remote configuration', () => {
  const route = read('app/api/admin/content/route.ts');
  const studio = read('components/admin-studio-v2.tsx');
  const media = read('components/admin-media-studio.tsx');
  const nextConfig = read('next.config.ts');
  assert.match(route, /isAllowedImageSource/);
  assert.match(route, /member\.photo/);
  assert.match(route, /item\.image_url/);
  assert.match(studio, /safeImageSource\(/);
  assert.match(media, /isAllowedImageSource\(/);
  assert.match(nextConfig, /wyjsosamlkbwksrslona\.supabase\.co/);
  assert.match(nextConfig, /i\.ytimg\.com/);
});
