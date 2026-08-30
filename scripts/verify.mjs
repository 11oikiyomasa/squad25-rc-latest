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
assert(!nav.includes("'/scrims'"), 'Public navigation still contains the retired /scrims route');

const matches = read('app/matches/page.tsx');
assert(matches.includes("alternates: { canonical: '/matches' }"), 'Matches canonical route is missing');
assert(!matches.includes("from '@/app/scrims/page'"), 'Matches page still imports the legacy scrims page and risks a redirect loop');
const media = read('app/media/page.tsx');
assert(media.includes("alternates: { canonical: '/media' }"), 'Media canonical route is missing');
const legacyScrims = read('app/scrims/page.tsx');
assert(legacyScrims.includes("redirect('/matches')"), 'Legacy /scrims route does not deep-link to /matches');
const legacyAdminScrims = read('app/admin/scrims/page.tsx');
assert(legacyAdminScrims.includes("redirect('/admin/matches')"), 'Legacy admin /scrims route does not deep-link to /admin/matches');

const adminAuth = read('lib/admin-auth.ts');
assert(adminAuth.includes("redirect('/login?error=not_authenticated&next=%2Fadmin')"), 'Unauthenticated admin users no longer route to login');
assert(adminAuth.includes("redirect('/403')"), 'Authenticated non-admin users no longer route to access denied');
assert(read('app/403/page.tsx').includes('href="/login"'), '403 page lacks alternate-account path');
assert(read('app/not-found.tsx').includes('href="/"'), '404 page lacks home recovery path');
assert(read('app/loading.tsx').includes('Loading archive.'), 'Global loading state is missing');
assert(read('app/error.tsx').includes('Try again'), 'Route error recovery action is missing');

const sitemap = read('app/sitemap.ts');
for (const route of ['/roster', '/matches', '/media', '/recruitment']) assert(sitemap.includes(`siteUrl}${route}`), `Sitemap missing ${route}`);

const design = read('app/globals.css');
const ui = read('components/ui.tsx');
assert(fs.existsSync(path.join(root, 'components', 'ui.tsx')), 'Shared UI primitives file is missing');
for (const primitive of ['export function Button', 'export function Card', 'export function Section', 'export function PageHeader', 'export function EmptyState', 'export function AppShell']) assert(ui.includes(primitive), `Shared UI primitive missing: ${primitive}`);
assert(fs.existsSync(path.join(root, 'components', 'member-card.tsx')), 'Shared MemberCard component is missing');
for (const token of ['--paper:', '--panel:', '--ink:', '--acid:', '--ember:', '--line:', '--space-4:', '--space-6:', '--space-8:', '--radius-control:', '--shadow-card:', '--duration-normal:']) assert(design.includes(token), `Design token missing: ${token}`);
for (const breakpoint of ['@media (max-width: 389px)', '@media (min-width: 390px) and (max-width: 429px)', '@media (min-width: 430px) and (max-width: 767px)', '@media (min-width: 768px) and (max-width: 1023px)', '@media (min-width: 1024px) and (max-width: 1279px)', '@media (min-width: 1280px)']) assert(design.includes(breakpoint), `Responsive breakpoint missing: ${breakpoint}`);
assert(design.includes('overflow-x: clip'), 'Global overflow guard is missing');
assert(design.includes(':focus-visible'), 'Shared focus-visible treatment is missing');
assert(design.includes('prefers-reduced-motion'), 'Reduced-motion accessibility treatment is missing');
assert(design.includes('.ui-button-primary') && design.includes('.ui-button-secondary') && design.includes('.ui-button-ghost'), 'Button variants are incomplete');
assert(design.includes('.ui-field:focus'), 'Shared form focus state is missing');

const home = read('components/home-landing.tsx');
assert(home.includes("from '@/components/member-card'"), 'Homepage does not use the shared MemberCard');
assert(home.includes('selectFeaturedMember'), 'Homepage does not use the explicit featured-member selector');
assert(!home.includes('members[3]'), 'Homepage still relies on the fragile members[3] featured slot');
assert(home.includes('href="/matches"'), 'Homepage does not link to /matches');
assert(home.includes('href="/media"'), 'Homepage does not link to /media');
assert(!home.includes('href="/scrims"'), 'Homepage still contains the retired /scrims route');
assert(!/function\s+FeaturedCard\s*\(/.test(home), 'Homepage still duplicates the MemberCard implementation');
const roster = read('components/roster-content.tsx');
assert(roster.includes("from '@/components/member-card'"), 'Roster does not use the shared MemberCard');
assert(!/function\s+RosterCard\s*\(/.test(roster), 'Roster still duplicates the MemberCard implementation');
assert(roster.includes('ui-field'), 'Roster search does not use the shared form control');

const matchesComponent = read('components/match-center.tsx');
assert(matchesComponent.includes('href="/matches"'), 'Match Center CTA does not point to the canonical /matches route');
const memberPage = read('app/member/[id]/page.tsx');
assert(memberPage.includes('href="/recruitment"'), 'Member profile lacks the recruitment bridge');
assert(memberPage.includes("PublicNav active=\"member\""), 'Member profile is not integrated with public navigation');

const admin = read('app/admin/page.tsx');
for (const href of ['/admin', '/admin/roster', '/admin/matches', '/admin/media', '/admin/recruitment']) assert(admin.includes(href), `Admin navigation missing ${href}`);

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
console.log('- Design system: shared tokens / primitives / controls');
console.log('- Responsive breakpoints: 360 / 390 / 430 / 768 / 1024 / 1280+');
console.log('- MemberCard duplication: none');
console.log(`- Seed members: ${names.length}/25`);
