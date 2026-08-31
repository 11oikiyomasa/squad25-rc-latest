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

test('regression: admin roster studio is protected from cloud hydration overwriting an unpublished draft', () => {
  const wrapper = read('components/admin-studio-safe.tsx');
  assert.match(wrapper, /localStorage\.getItem\(DRAFT_KEY\)/);
  assert.match(wrapper, /localStorage\.getItem\(PUBLISHED_KEY\)/);
  assert.match(wrapper, /EMPTY_PUBLISHED_MARKER/);
  const overview = read('app/admin/overview/page.tsx');
  const roster = read('app/admin/roster/page.tsx');
  assert.match(overview, /AdminStudioSafe/);
  assert.match(roster, /AdminStudioSafe/);
});

test('regression: published image sources must match next/image remote configuration', () => {
  const route = read('app/api/admin/content/route.ts');
  const nextConfig = read('next.config.ts');
  assert.match(route, /isAllowedImageSource/);
  assert.match(route, /member\.photo/);
  assert.match(route, /item\.image_url/);
  assert.match(nextConfig, /wyjsosamlkbwksrslona\.supabase\.co/);
  assert.match(nextConfig, /i\.ytimg\.com/);
});
