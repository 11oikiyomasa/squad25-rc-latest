import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const assert = (condition, message) => { if (!condition) failures.push(message); };

const requiredRoutes = [
  'app/page.tsx',
  'app/roster/page.tsx',
  'app/roster/[member_id]/page.tsx',
  'app/matches/page.tsx',
  'app/matches/[match_id]/page.tsx',
  'app/media/page.tsx',
  'app/recruitment/page.tsx',
  'app/recruitment/[slug]/page.tsx',
  'app/recruitment/[slug]/apply/page.tsx',
  'app/recruitment/success/page.tsx',
  'app/login/page.tsx',
  'app/admin/page.tsx',
  'app/admin/overview/page.tsx',
  'app/admin/roster/page.tsx',
  'app/admin/matches/page.tsx',
  'app/admin/media/page.tsx',
  'app/admin/recruitment/page.tsx',
  'app/admin/recruitment/[id]/page.tsx',
  'app/not-found.tsx',
  'app/403/page.tsx',
  'app/loading.tsx',
  'app/error.tsx',
];
for (const route of requiredRoutes) assert(exists(route), `Missing IA route: ${route}`);

const sourceFiles = [];
for (const folder of ['app', 'components', 'data', 'lib']) {
  const base = path.join(root, folder);
  if (!exists(folder)) continue;
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
  assert(!/onClick\s*=\s*\{?\s*\(\)\s*=>\s*console\.log/.test(source), `Dummy onClick console.log found: ${path.relative(root, file)}`);
}

for (const file of [
  'app/page.tsx',
  'components/home-ux.tsx',
  'app/roster/page.tsx',
  'app/roster/[member_id]/page.tsx',
  'app/matches/page.tsx',
  'app/matches/[match_id]/page.tsx',
  'app/media/page.tsx',
  'app/recruitment/page.tsx',
  'app/recruitment/[slug]/page.tsx',
  'components/public-nav.tsx',
  'components/match-center.tsx',
]) {
  const source = read(file);
  assert(!source.includes("'/scrims'") && !source.includes('"/scrims"'), `Canonical public source still references retired /scrims: ${file}`);
  assert(!source.includes("'/member/") && !source.includes('"/member/'), `Canonical public source still references legacy /member: ${file}`);
}

const nav = read('components/public-nav.tsx');
for (const href of ["'/'", "'/roster'", "'/matches'", "'/media'", "'/recruitment'"]) assert(nav.includes(`href: ${href}`), `Public navigation missing ${href}`);
for (const label of ["label: 'Matches'", "label: 'Media'", "label: 'Recruitment'"]) assert(nav.includes(label), `Public navigation missing ${label}`);
assert(!nav.includes("'/scrims'"), 'Public navigation still contains retired /scrims');

const matches = read('app/matches/page.tsx');
assert(matches.includes("alternates: { canonical: '/matches' }"), 'Matches canonical route is missing');
assert(!matches.includes("from '@/app/scrims/page'"), 'Matches page imports legacy scrims page');
const matchDetail = read('app/matches/[match_id]/page.tsx');
assert(matchDetail.includes('alternates: { canonical: `/matches/${scrim.id}` }'), 'Match detail canonical metadata is missing');
assert(matchDetail.includes('href="/matches"'), 'Match detail lacks return path');
assert(matchDetail.includes('aria-label="Breadcrumb"'), 'Match detail breadcrumb is missing');
const scrimsContent = read('components/scrims-content.tsx');
assert(scrimsContent.includes('href={`/matches/${scrim.id}`}'), 'Match index does not connect public match detail routes');
const media = read('app/media/page.tsx');
assert(media.includes("alternates: { canonical: '/media' }"), 'Media canonical route is missing');
const legacyScrims = read('app/scrims/page.tsx');
assert(legacyScrims.includes("redirect('/matches')"), 'Legacy /scrims route does not redirect to /matches');
const legacyAdminScrims = read('app/admin/scrims/page.tsx');
assert(legacyAdminScrims.includes("redirect('/admin/matches')"), 'Legacy admin /scrims route does not redirect to /admin/matches');
const legacyAdminPreview = read('app/admin/preview/page.tsx');
assert(legacyAdminPreview.includes("redirect('/admin/overview')"), 'Legacy admin /preview route does not redirect to /admin/overview');
const legacyMember = read('app/member/[id]/page.tsx');
assert(legacyMember.includes('redirect(`/roster/${encodeURIComponent(id)}`)'), 'Legacy /member/[id] route does not redirect to canonical roster detail');

const adminAuth = read('lib/admin-auth.ts');
assert(adminAuth.includes("redirect('/login?error=not_authenticated&next=%2Fadmin')"), 'Unauthenticated admin users no longer route to login');
assert(adminAuth.includes("redirect('/403')"), 'Authenticated non-admin users no longer route to access denied');
assert(read('app/403/page.tsx').includes('href="/login"'), '403 page lacks alternate-account path');
assert(read('app/not-found.tsx').includes('href="/"'), '404 page lacks home recovery path');
assert(read('app/loading.tsx').includes('Loading archive.'), 'Global loading state is missing');
assert(read('app/error.tsx').includes('Try again'), 'Route error recovery action is missing');

const member = read('app/roster/[member_id]/page.tsx');
assert(member.includes('aria-label="Breadcrumb"'), 'Member detail breadcrumb is missing');
assert(member.includes('alternates: { canonical: `/roster/${member.id}` }'), 'Member detail canonical metadata is missing');
assert(member.includes('href="/recruitment"'), 'Member detail lacks recruitment bridge');
assert(member.includes('ShareMember'), 'Member detail lacks share action');
const sitemap = read('app/sitemap.ts');
for (const route of ['/roster', '/matches', '/media', '/recruitment']) assert(sitemap.includes(`siteUrl}${route}`), `Sitemap missing ${route}`);
assert(sitemap.includes('/roster/${member.id}'), 'Sitemap still uses legacy member URL');
assert(!sitemap.includes('/member/${member.id}'), 'Sitemap contains legacy member route');

const admin = read('app/admin/overview/page.tsx');
for (const href of ['/admin/overview', '/admin/roster', '/admin/matches', '/admin/media', '/admin/recruitment']) assert(admin.includes(href), `Admin overview navigation missing ${href}`);
const adminEntry = read('app/admin/page.tsx');
assert(adminEntry.includes("redirect('/admin/overview')"), 'Admin root does not canonicalize to /admin/overview');
const adminDetail = read('app/admin/recruitment/[id]/page.tsx');
assert(adminDetail.includes('await requireAdmin()'), 'Admin recruitment detail lacks server-side RBAC');
assert(adminDetail.includes('aria-label="Breadcrumb"'), 'Admin recruitment detail breadcrumb is missing');
assert(adminDetail.includes('href="/admin/recruitment"'), 'Admin recruitment detail lacks return path');
const inbox = read('components/recruitment-inbox.tsx');
assert(inbox.includes('href={`/admin/recruitment/${selected.application.id}`}'), 'Recruitment inbox does not connect to canonical application detail');

const home = read('components/home-ux.tsx');
assert(home.includes("from '@/components/member-card'"), 'Homepage does not use shared MemberCard');
assert(home.includes('href="/media"'), 'Homepage does not link to /media');
assert(home.includes('href="/recruitment"'), 'Homepage does not link to /recruitment');
const matchCenter = read('components/match-center.tsx');
assert(matchCenter.includes('href="/matches"'), 'Homepage Match Center does not expose a canonical /matches path');
const roster = read('components/roster-content.tsx');
assert(roster.includes("from '@/components/member-card'"), 'Roster does not use shared MemberCard');
assert(roster.includes('ui-field'), 'Roster search does not use shared form control');

const design = read('app/globals.css');
const ui = read('components/ui.tsx');
for (const primitive of ['export function Button', 'export function Card', 'export function Section', 'export function PageHeader', 'export function EmptyState', 'export function AppShell']) assert(ui.includes(primitive), `Shared UI primitive missing: ${primitive}`);
assert(exists('components/member-card.tsx'), 'Shared MemberCard component is missing');
for (const token of ['--paper:', '--panel:', '--ink:', '--acid:', '--ember:', '--line:', '--space-4:', '--space-6:', '--space-8:', '--radius-control:', '--shadow-card:', '--duration-normal:']) assert(design.includes(token), `Design token missing: ${token}`);
for (const breakpoint of ['@media (max-width: 389px)', '@media (min-width: 390px) and (max-width: 429px)', '@media (min-width: 430px) and (max-width: 767px)', '@media (min-width: 768px) and (max-width: 1023px)', '@media (min-width: 1024px) and (max-width: 1279px)', '@media (min-width: 1280px)']) assert(design.includes(breakpoint), `Responsive breakpoint missing: ${breakpoint}`);
assert(design.includes('overflow-x: clip'), 'Global overflow guard is missing');
assert(design.includes(':focus-visible'), 'Shared focus-visible treatment is missing');
assert(design.includes('prefers-reduced-motion'), 'Reduced-motion accessibility treatment is missing');
assert(design.includes('.ui-button-primary') && design.includes('.ui-button-secondary') && design.includes('.ui-button-ghost'), 'Button variants are incomplete');
assert(design.includes('.ui-field:focus'), 'Shared form focus state is missing');

const squad = read('data/squad.ts');
const namesMatch = squad.match(/const names = \[(.*?)\] as const/s);
const names = namesMatch ? [...namesMatch[1].matchAll(/\['([A-Z0-9]+)'\s*,/g)].map((m) => m[1]) : [];
assert(names.length === 25, `Expected 25 seed members, found ${names.length}`);
assert(new Set(names).size === names.length, 'Duplicate member nickname found in seed data');
assert(exists('scripts/verify.mjs'), 'Verification script missing');

if (failures.length) {
  console.error('VERIFY: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('VERIFY: PASS');
console.log(`- Canonical IA routes: ${requiredRoutes.length}`);
console.log('- Public navigation: Home / Roster / Matches / Media / Recruitment');
console.log('- Admin navigation: Overview / Roster / Matches / Media / Recruitment');
console.log('- Deep links: roster member / match / admin recruitment application');
console.log('- Legacy aliases: /member, /scrims, /admin/preview, /admin/scrims redirect');
console.log('- 404 / 403 / loading / error: present');
console.log('- Dead CTA href="#": none');
console.log('- Dummy console.log CTA handlers: none');
console.log('- Design system: shared tokens / primitives / controls');
console.log('- Responsive breakpoints: 360 / 390 / 430 / 768 / 1024 / 1280+');
console.log(`- Seed members: ${names.length}/25`);
