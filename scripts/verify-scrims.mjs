import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'app/loading.tsx',
  'app/scrims/page.tsx',
  'components/scrims-content.tsx',
  'components/match-center.tsx',
  'lib/scrims.ts',
  'app/api/admin/scrims/route.ts',
  'app/admin/scrims/page.tsx',
  'components/scrim-control.tsx',
  'supabase/migrations/20260829_add_scrims.sql',
];

for (const file of requiredFiles) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) throw new Error(`Missing scrim artifact: ${file}`);
}

const loading = fs.readFileSync(path.join(root, 'app/loading.tsx'), 'utf8');
const publicPage = fs.readFileSync(path.join(root, 'app/scrims/page.tsx'), 'utf8');
const publicContent = fs.readFileSync(path.join(root, 'components/scrims-content.tsx'), 'utf8');
const matchCenter = fs.readFileSync(path.join(root, 'components/match-center.tsx'), 'utf8');
const adminApi = fs.readFileSync(path.join(root, 'app/api/admin/scrims/route.ts'), 'utf8');
const adminPage = fs.readFileSync(path.join(root, 'app/admin/scrims/page.tsx'), 'utf8');
const control = fs.readFileSync(path.join(root, 'components/scrim-control.tsx'), 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'app/sitemap.ts'), 'utf8');

for (const [label, source, needles] of [
  ['loading screen', loading, ['SQUAD.25', 'Public squad archive', 'loading-sweep']],
  ['public page', publicPage, ['getPublicScrims', 'ScrimsContent', "canonical: '/scrims'", 'Match Center']],
  ['public wrapper', publicContent, ['MatchCenter', 'Scrim[]']],
  ['match center', matchCenter, ['NEXT SCRIM', 'W / L', 'No next match', 'Open match center']],
  ['admin API', adminApi, ['ensureAdmin', 'POST', 'PATCH', 'DELETE']],
  ['admin page', adminPage, ['requireAdmin', 'ScrimControl']],
  ['admin control', control, ['/api/admin/scrims', 'PUBLIC', 'PRIVATE']],
  ['sitemap', sitemap, ['/scrims']],
]) {
  for (const needle of needles) {
    if (!source.includes(needle)) throw new Error(`${label} is missing expected marker: ${needle}`);
  }
}

const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20260829_add_scrims.sql'), 'utf8');
for (const needle of ['create table if not exists public.scrims', 'Public can read public scrims', 'Admins manage scrims']) {
  if (!migration.includes(needle)) throw new Error(`Scrim migration missing expected marker: ${needle}`);
}

console.log(`Scrim verification passed (${requiredFiles.length} required artifacts).`);