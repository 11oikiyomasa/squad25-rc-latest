import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

test('regression: admin publish cannot silently drop achievements or gallery', () => {
  const route = read('app/api/admin/content/route.ts');
  const migration = read('supabase/migrations/20260831063302_harden_publish_snapshot.sql');
  for (const token of ['const achievements = candidate.achievements', 'const gallery = candidate.gallery', 'achievements: normalizedAchievements', 'gallery: normalizedGallery']) assert.match(route, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  for (const token of ['jsonb_typeof(payload->\'achievements\')', 'jsonb_typeof(payload->\'gallery\')', 'delete from achievements', 'delete from gallery_items']) assert.match(migration, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('regression: admin media route is a real media editor', () => {
  const page = read('app/admin/media/page.tsx');
  assert.match(page, /AdminMediaStudio/);
  const component = read('components/admin-media-studio.tsx');
  assert.match(component, /Gallery archive/);
  assert.match(component, /Achievements/);
  assert.match(component, /localStorage\.getItem\(DRAFT_KEY\)/);
  assert.match(component, /fetch\('\/api\/admin\/content'/);
});
