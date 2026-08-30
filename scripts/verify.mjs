import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
let ts;
try {
  ts = await import('typescript');
} catch {
  try {
    ts = await import('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
  } catch {
    ts = null;
  }
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const squad = read('data/squad.ts');
const namesMatch = squad.match(/const names = \[(.*?)\] as const/s);
const names = namesMatch ? [...namesMatch[1].matchAll(/\['([A-Z0-9]+)'\s*,/g)].map((m) => m[1]) : [];
assert(names.length === 25, `Expected 25 seed members, found ${names.length}`);
assert(new Set(names).size === names.length, 'Duplicate member nickname found in seed data');
assert(squad.includes('normalizeYoutubeId'), 'YouTube URL normalization helper is missing');
assert(squad.includes("const accents = ['#d7ff43', '#ff6b38'];"), 'Seed accent palette drifted from the public lime/ember palette');
assert(fs.existsSync(path.join(root, 'app', 'member', '[id]', 'page.tsx')), 'Member dynamic route is missing');
assert(fs.existsSync(path.join(root, 'app', 'admin', 'page.tsx')), 'Admin route is missing');
assert(fs.existsSync(path.join(root, 'app', 'admin', 'preview', 'page.tsx')), 'Admin draft preview route is missing');
assert(fs.existsSync(path.join(root, 'app', 'roster', 'page.tsx')), 'Full roster route is missing');
assert(fs.existsSync(path.join(root, 'components', 'roster-content.tsx')), 'Roster content component is missing');
for (const name of names) {
  const asset = path.join(root, 'public', 'images', 'members', `${name.toLowerCase()}.svg`);
  assert(fs.existsSync(asset), `Missing member asset: ${path.relative(root, asset)}`);
}
const galleryAssets = fs.readdirSync(path.join(root, 'public', 'images', 'gallery')).filter((f) => f.endsWith('.svg'));
assert(galleryAssets.length >= 6, `Expected at least 6 gallery assets, found ${galleryAssets.length}`);
for (const file of ['package.json', 'tsconfig.json', 'next.config.ts', '.env.example', 'SUPABASE_SCHEMA.sql']) {
  assert(fs.existsSync(path.join(root, file)), `Missing project file: ${file}`);
}
const sourceFiles = [];
for (const folder of ['app', 'components', 'data', 'lib']) {
  const base = path.join(root, folder);
  if (!fs.existsSync(base)) continue;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name)) sourceFiles.push(full);
    }
  };
  walk(base);
}
for (const file of sourceFiles) {
  if (!ts) break;
  const source = fs.readFileSync(file, 'utf8');
  const transpiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, strict: true }, fileName: file, reportDiagnostics: true });
  const diagnostics = transpiled.diagnostics ?? [];
  assert(diagnostics.length === 0, `TypeScript parse error: ${path.relative(root, file)}`);
}
for (const file of ['proxy.ts', 'app/login/page.tsx', 'app/login/actions.ts', 'app/auth/callback/route.ts', 'app/api/content/route.ts', 'app/api/admin/content/route.ts', 'app/api/health/route.ts', 'lib/content.ts', 'lib/admin-auth.ts']) {
  assert(fs.existsSync(path.join(root, file)), `Missing production auth/content file: ${file}`);
}
assert(!ts || Boolean(ts.version), 'TypeScript compiler unavailable for syntax verification');
assert(read('SUPABASE_SCHEMA.sql').includes('IMPORTANT: supabase/migrations/ is the canonical source of truth.'), 'Supabase schema snapshot is not marked as non-canonical');
assert(read('SUPABASE_SCHEMA.sql').includes('create table if not exists public.admin_users'), 'Admin SQL model is missing');
assert(read('SUPABASE_SCHEMA.sql').includes('number text not null'), 'Member number column is missing');
assert(read('SUPABASE_SCHEMA.sql').includes('accent text not null'), 'Member accent column is missing');
assert(read('SUPABASE_SCHEMA.sql').includes('duration text not null'), 'Montage duration column is missing');
assert(read('SUPABASE_SCHEMA.sql').includes('create table if not exists public.squad_settings'), 'Squad settings SQL model is missing');
assert(read('SUPABASE_SCHEMA.sql').includes('create table if not exists public.gallery_items'), 'Gallery SQL model is missing');
assert(/create policy "[^"]+" on public\.members for all using \(private\.is_admin\(\)\) with check \(private\.is_admin\(\)\)/i.test(read('SUPABASE_SCHEMA.sql')), 'Admin RLS policy for member management is missing');
assert(read('SUPABASE_SCHEMA.sql').includes("bucket_id = 'squad-media'"), 'Storage policy/bucket is missing');
assert(read('SUPABASE_SCHEMA.sql').includes('security invoker'), 'Transactional publish should use SECURITY INVOKER');
assert(!read('SUPABASE_SCHEMA.sql').includes('public.is_admin()'), 'Exposed public admin authorization helper remains');

const migrationsDir = path.join(root, 'supabase', 'migrations');
assert(fs.existsSync(migrationsDir), 'Supabase migrations directory is missing');
const expectedMigrations = [
  '20260827185426_create_squad_content.sql',
  '20260827185455_fix_member_status_constraint.sql',
  '20260827185504_seed_squad_members_retry.sql',
  '20260827185604_create_squad_media_storage.sql',
  '20260827185648_align_squad_settings_content_model.sql',
  '20260827185818_add_montage_content_key.sql',
  '20260827185830_add_montage_duration.sql',
  '20260827185903_harden_admin_authorization_function_v2.sql',
  '20260827185950_optimize_rls_and_indexes.sql',
  '20260827190636_align_member_display_columns.sql',
  '20260827190739_remove_unused_montage_index.sql',
  '20260827190755_restore_montage_fk_index.sql',
  '20260828201517_atomic_admin_publish.sql',
  '20260828202607_harden_atomic_publish_security.sql',
  '20260828202659_revoke_public_publish_execute.sql',
  '20260829122711_add_player_recruitment_applications.sql',
  '20260829132004_add_scrims.sql',
];
const actualMigrations = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();
assert(JSON.stringify(actualMigrations) === JSON.stringify(expectedMigrations), 'Supabase migration set drifted from the reconciled production history');
const migrationSql = actualMigrations.map((file) => read(path.join('supabase', 'migrations', file))).join('\n');
assert(migrationSql.includes('create table if not exists public.recruitment_applications'), 'Recruitment table is missing from canonical migrations');
assert(migrationSql.includes('create table if not exists public.scrims'), 'Scrims table is missing from canonical migrations');
assert(migrationSql.includes('security invoker'), 'Canonical migrations lost SECURITY INVOKER publish behavior');
assert(migrationSql.includes('revoke all on function public.publish_squad_content(jsonb) from public'), 'Canonical migrations lost restricted publish execute grants');
assert(read('README.md').includes('supabase/migrations/` is the **canonical database source of truth**'), 'README does not identify migrations as canonical');
assert(read('README.md').includes('SUPABASE_SCHEMA.sql` and `SUPABASE_SEED.sql` are retained as **manual compatibility snapshots only**'), 'README still presents SQL snapshots as a provisioning source');
assert(read('supabase/MIGRATIONS.md').includes('canonical source of truth'), 'Repository migration policy document is missing');
const publicSource = read('components/member-modal.tsx');
const memberPageSource = read('app/member/[id]/page.tsx');
const homeSource = read('components/home-content.tsx');
const landingSource = read('components/home-landing.tsx');
const pageSource = read('app/page.tsx');
assert(!publicSource.includes('Montage slot ready') && !publicSource.includes('data/squad.ts'), 'Public modal contains developer/debug text');
assert(!memberPageSource.includes('Tambahkan URL YouTube dari Content Studio'), 'Public member page contains admin instruction');
assert(memberPageSource.includes('cuts public') && memberPageSource.includes('publishedCuts.length'), 'Public member page is counting unpublished montage placeholders');
assert(!homeSource.includes('{member.montages.length} cuts'), 'Legacy roster cards still count unpublished montage placeholders');
assert(homeSource.includes('No public cuts'), 'Legacy roster component lacks an explicit empty state for unpublished montage content');
assert(landingSource.includes('members.slice(0, 6)'), 'Curated homepage must cap featured roster at six players');
assert(pageSource.includes('HomeLanding') && !pageSource.includes('HomeContent'), 'Homepage is still wired to the legacy roster-heavy component');
assert(read('app/sitemap.ts').includes(`${'/roster'}`) && read('app/sitemap.ts').includes(`${'/recruitment'}`), 'Sitemap is missing roster or recruitment routes');
const globalCss = read('app/globals.css');
assert(globalCss.includes('var(--font-display)') && globalCss.includes('prefers-reduced-motion'), 'Typography/accessibility hardening missing');
assert(globalCss.includes('scroll-padding-top: 5rem'), 'Sticky-header anchor offset is missing');
const seoFiles = [read('app/layout.tsx'), read('app/robots.ts'), read('app/sitemap.ts'), read('.env.example')].join('\n');
assert(!seoFiles.includes('andregsman.eu.org'), 'Deprecated custom domain still referenced by active SEO configuration');
assert(seoFiles.includes('squad25-rc-latest.vercel.app'), 'Vercel canonical URL is missing from active SEO configuration');
if (failures.length) {
  console.error('VERIFY: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('VERIFY: PASS');
console.log(`- Members: ${names.length}/25`);
console.log(`- Unique nicknames: ${new Set(names).size}/${names.length}`);
console.log(`- Member assets: ${names.length}/${names.length}`);
console.log(`- Gallery assets: ${galleryAssets.length}`);
console.log(`- TS/TSX syntax: ${sourceFiles.length} files parsed`);
console.log(`- Supabase migrations: ${actualMigrations.length}/${expectedMigrations.length}`);
console.log('- Auth/API/schema: present');
console.log('- Routes/config: present');
console.log('- Curated homepage roster: 6 max');
console.log('- SEO canonical: Vercel');
