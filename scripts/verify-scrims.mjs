import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'app/loading.tsx',
  'app/matches/page.tsx',
  'app/scrims/page.tsx',
  'components/scrims-content.tsx',
  'components/match-center.tsx',
  'lib/scrims.ts',
  'app/api/admin/scrims/route.ts',
  'app/admin/matches/page.tsx',
  'app/admin/scrims/page.tsx',
  'components/scrim-control.tsx',
  'supabase/migrations/20260829132004_add_scrims.sql',
  'supabase/migrations/20260831021900_harden_match_lifecycle.sql',
];

for (const file of requiredFiles) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) throw new Error(`Missing scrim artifact: ${file}`);
}

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const loading = read('app/loading.tsx');
const publicMatchesPage = read('app/matches/page.tsx');
const legacyPublicPage = read('app/scrims/page.tsx');
const publicContent = read('components/scrims-content.tsx');
const matchCenter = read('components/match-center.tsx');
const scrims = read('lib/scrims.ts');
const adminApi = read('app/api/admin/scrims/route.ts');
const adminMatchesPage = read('app/admin/matches/page.tsx');
const legacyAdminPage = read('app/admin/scrims/page.tsx');
const control = read('components/scrim-control.tsx');
const sitemap = read('app/sitemap.ts');
const lifecycleMigration = read('supabase/migrations/20260831021900_harden_match_lifecycle.sql');

for (const [label, source, needles] of [
  ['loading screen', loading, ['SQUAD.25', 'Public squad archive', 'loading-sweep']],
  ['canonical public matches page', publicMatchesPage, ['getPublicScrims', 'ScrimsContent', "canonical: '/matches'", "title: 'Matches — SQUAD.25'"]],
  ['legacy public scrims route', legacyPublicPage, ["redirect('/matches')"]],
  ['public content bridge', publicContent, ['MatchCenter']],
  ['match lifecycle UI', matchCenter, ['01 — Live', '02 — Scheduled', '03 — Completed', '04 — Cancelled', 'SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED', 'Countdown', 'event_name', 'recap_url', 'media_url']],
  ['match data source', scrims, ['ScrimStatus', "'CANCELLED'", 'event_name', 'recap_url', 'media_url', 'visibility', "status = 'CANCELLED'"]],
  ['admin API', adminApi, ['ensureAdmin', 'POST', 'PATCH', 'DELETE', 'Invalid lifecycle transition', 'New matches must start as SCHEDULED', 'eventName', 'recapUrl', 'mediaUrl']],
  ['canonical admin matches page', adminMatchesPage, ['requireAdmin', 'ScrimControl']],
  ['legacy admin scrims route', legacyAdminPage, ["redirect('/admin/matches')"]],
  ['admin control', control, ['/api/admin/scrims', 'PUBLIC', 'PRIVATE', 'Lifecycle state', 'Recap URL', 'Media URL']],
  ['sitemap', sitemap, ['/matches']],
  ['lifecycle migration', lifecycleMigration, ['event_name', 'recap_url', 'media_url', 'scrims_state_result_check', 'enforce_scrim_lifecycle', 'scrims_lifecycle_guard', "old.status = 'SCHEDULED'", "old.status = 'LIVE'"]],
]) {
  for (const needle of needles) {
    if (!source.includes(needle)) throw new Error(`${label} is missing expected marker: ${needle}`);
  }
}

const baseMigration = read('supabase/migrations/20260829132004_add_scrims.sql');
for (const needle of ['create table if not exists public.scrims', 'Public can read public scrims', 'Admins manage scrims']) {
  if (!baseMigration.includes(needle)) throw new Error(`Scrim migration missing expected marker: ${needle}`);
}

console.log(`Scrim verification passed (${requiredFiles.length} required artifacts).`);
