import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) failures.push(message); };

const requiredRoutes = [
  'app/page.tsx',
  'app/roster/page.tsx',
  'app/matches/page.tsx',
  'app/media/page.tsx',
  'app/recruitment/page.tsx',
  'app/login/page.tsx',
  'app/admin/page.tsx',
  'app/admin/roster/page.tsx',
  'app/admin/matches/page.tsx',
  'app/admin/media/page.tsx',
  'app/admin/recruitment/page.tsx',
  'app/member/[id]/page.tsx',
  'app/not-found.tsx',
  'app/403/page.tsx',
  'app/loading.tsx',
  'app/error.tsx',
];
for (const route of requiredRoutes) assert(fs.existsSync(path.join(root, route)), `Missing IA route: ${route}`);

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
  const source = fs.readFileSync(file, 'utf8');
  assert(!/href\s*=\s*["']#["']/.test(source), `Dead CTA href="#" found: ${path.relative(root, file)}`);
}

const nav = read('components/public-nav.tsx');
for (const href of ["'/'", "'/roster'", "'/matches'", "'/media'", "'/recruitment'"]) assert(nav.includes(`href: ${href}`), `Public navigation missing ${href}`);
assert(nav.includes("label: 'Matches'"), 'Public navigation does not use the final Matches label');
assert(nav.includes("label: 'Media'"), 'Public navigation does not expose Media');
assert(nav.includes("label: 'Recruitment'"), 'Public navigation does not use the final Recruitment label');

const matches = read('app/matches/page.tsx');
assert(matches.includes("alternates: { canonical: '/matches' }"), 'Matches canonical route is missing');
const media = read('app/media/page.tsx');
assert(media.includes("alternates: { canonical: '/media' }"), 'Media canonical route is missing');
const legacyScrims = read('app/scrims/page.tsx');
assert(legacyScrims.includes("redirect('/matches')"), 'Legacy /scrims route does not deep-link to /matches');

const adminAuth = read('lib/admin-auth.ts');
assert(adminAuth.includes("redirect('/login?error=not_authenticated&next=%2Fadmin')"), 'Unauthenticated admin users no longer route to login');
assert(adminAuth.includes("redirect('/403')"), 'Authenticated non-admin users no longer route to access denied');
assert(read('app/403/page.tsx').includes('href="/login"'), '403 page lacks alternate-account path');
assert(read('app/not-found.tsx').includes('href="/"'), '404 page lacks home recovery path');
assert(read('app/loading.tsx').includes('Loading archive.'), 'Global loading state is missing');
assert(read('app/error.tsx').includes('Try again'), 'Route error recovery action is missing');

const sitemap = read('app/sitemap.ts');
for (const route of ['/roster', '/matches', '/media', '/recruitment']) assert(sitemap.includes(`siteUrl}${route}`), `Sitemap missing ${route}`);

const squad = read('data/squad.ts');
const namesMatch = squad.match(/const names = \[(.*?)\] as const/s);
const names = namesMatch ? [...namesMatch[1].matchAll(/\['([A-Z0-9]+)'\s*,/g)].map((m) => m[1]) : [];
assert(names.length === 25, `Expected 25 seed members, found ${names.length}`);
assert(new Set(names).size === names.length, 'Duplicate member nickname found in seed data');
assert(fs.existsSync(path.join(root, 'scripts', 'verify.mjs')), 'Verification script missing');

if (failures.length) {
  console.error('VERIFY: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('VERIFY: PASS');
console.log(`- IA routes: ${requiredRoutes.length}`);
console.log('- Navigation: Home / Roster / Matches / Media / Recruitment');
console.log('- Admin: Overview / Roster / Matches / Media / Recruitment');
console.log('- 404 / 403 / loading / error: present');
console.log('- Dead CTA href="#": none');
console.log('- Legacy /scrims: redirects to /matches');
console.log(`- Seed members: ${names.length}/25`);
