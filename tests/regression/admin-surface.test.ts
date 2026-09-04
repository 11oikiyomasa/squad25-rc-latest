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

test('regression: roster and overview use the hardened single content studio implementation', () => {
  const overview = read('app/admin/overview/page.tsx');
  const roster = read('app/admin/roster/page.tsx');
  assert.match(overview, /AdminStudioV2/);
  assert.match(roster, /AdminStudioV2/);
});

test('regression: recruitment inbox ignores stale list/detail responses', () => {
  const source = read('components/recruitment-inbox.tsx');
  assert.match(source, /const requestVersion = useRef\(0\)/);
  assert.match(source, /const detailVersion = useRef\(0\)/);
  assert.match(source, /version !== requestVersion\.current/);
  assert.match(source, /currentDetail !== detailVersion\.current/);
});

test('regression: publish RPC can execute its private admin check without exposing the private schema', () => {
  const migration = read('supabase/migrations/20260831065450_fix_publish_content_private_schema_permissions.sql');
  assert.match(migration, /alter function public\.publish_squad_content\(jsonb\) security definer/);
  assert.match(migration, /set search_path = public/);
  assert.match(migration, /revoke execute on function public\.publish_squad_content\(jsonb\) from anon/);
  assert.match(migration, /grant execute on function public\.publish_squad_content\(jsonb\) to authenticated/);
});

test('regression: stale admin content publish must use an optimistic concurrency token', () => {
  const route = read('app/api/admin/content/route.ts');
  const publishMigration = read('supabase/migrations/20260828201517_atomic_admin_publish.sql');

  assert.match(route, /expectedUpdatedAt/);
  assert.match(route, /expected_updated_at/);
  assert.match(route, /status: 409/);
  assert.match(publishMigration, /expected_updated_at/);
});
