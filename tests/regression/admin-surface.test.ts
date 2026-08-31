import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

test('regression: admin auth fails closed when Supabase is unavailable', () => {
  const source = read('lib/admin-auth.ts');
  assert.match(source, /if \(!isSupabaseConfigured\(\)\) redirect\('\/login\?error=not_configured/);
});

test('regression: admin preview renders the local draft instead of redirecting away', () => {
  const source = read('app/admin/preview/page.tsx');
  assert.doesNotMatch(source, /redirect\('\/admin\/overview'\)/);
  assert.match(source, /localStorage\.getItem\(STORAGE_KEY\)/);
  assert.match(source, /<MemberModal\s+member=\{selected\}/);
});

test('regression: every admin section is protected by the shared layout', () => {
  const layout = read('app/admin/layout.tsx');
  assert.match(layout, /await requireAdmin\(\)/);
  for (const path of [
    'app/admin/overview/page.tsx',
    'app/admin/roster/page.tsx',
    'app/admin/matches/page.tsx',
    'app/admin/media/page.tsx',
    'app/admin/recruitment/page.tsx',
  ]) {
    const source = read(path);
    assert.doesNotMatch(source, /requireAdmin/);
  }
});

test('regression: admin navigation exposes all canonical control-room sections', () => {
  const layout = read('app/admin/layout.tsx');
  for (const label of ['Overview', 'Roster', 'Matches', 'Media', 'Recruitment']) assert.match(layout, new RegExp(label));
  assert.match(layout, /href="\/"/);
});
