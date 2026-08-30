import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
function assert(condition, message) { if (!condition) failures.push(message); }

for (const file of [
  'app/recruitment/page.tsx',
  'components/recruitment-form.tsx',
  'app/api/recruitment/route.ts',
  'app/admin/recruitment/page.tsx',
  'components/recruitment-inbox.tsx',
  'app/api/admin/recruitment/route.ts',
  'supabase/migrations/20260829122711_add_player_recruitment_applications.sql',
  'supabase/migrations/20260830084031_harden_recruitment_rate_limit.sql',
]) {
  assert(fs.existsSync(path.join(root, file)), `Missing recruitment file: ${file}`);
}

const migration = read('supabase/migrations/20260829122711_add_player_recruitment_applications.sql');
assert(migration.includes('create table if not exists public.recruitment_applications'), 'Recruitment table migration is missing');
assert(migration.includes("for insert\nto anon"), 'Anonymous recruitment insert policy is missing from the historical migration');
assert(migration.includes('private.is_admin()'), 'Admin recruitment authorization is missing');
assert(migration.includes('revoke all on table public.recruitment_applications from anon, authenticated'), 'Recruitment table privileges are not locked down in the historical migration');
assert(migration.includes('grant insert on table public.recruitment_applications to anon'), 'Historical recruitment insert grant is missing');
assert(migration.includes('grant select, update on table public.recruitment_applications to authenticated'), 'Admin recruitment grants are missing');

const hardening = read('supabase/migrations/20260830084031_harden_recruitment_rate_limit.sql');
assert(hardening.includes('create table if not exists private.recruitment_rate_limits'), 'Recruitment rate-limit table is missing');
assert(hardening.includes('create or replace function public.submit_recruitment_application(jsonb, text)'), 'Atomic recruitment submission function is missing');
assert(hardening.includes("request_count >= 5"), 'IP rate-limit threshold is missing');
assert(hardening.includes("interval '15 minutes'"), 'IP rate-limit window is missing');
assert(hardening.includes("interval '24 hours'"), 'Recruitment contact cooldown is missing');
assert(hardening.includes('pg_advisory_xact_lock'), 'Recruitment rate limiter lacks transactional concurrency locking');
assert(hardening.includes('revoke insert on table public.recruitment_applications from anon, authenticated'), 'Direct anonymous recruitment inserts remain enabled');

const form = read('components/recruitment-form.tsx');
assert(form.includes("fetch('/api/recruitment'"), 'Recruitment form is not connected to the API');
assert(form.includes('website'), 'Recruitment honeypot field is missing');
assert(form.includes('Do not send') || form.includes('Jangan kirim password'), 'Sensitive-data warning is missing');

const publicApi = read('app/api/recruitment/route.ts');
assert(publicApi.includes("body.website"), 'Recruitment API does not evaluate the honeypot');
assert(publicApi.includes("status: 'NEW'") || publicApi.includes("status: 429"), 'Recruitment API does not expose expected submission result handling');
assert(publicApi.includes('new URL(socialUrl)'), 'Recruitment API URL validation is missing');
assert(publicApi.includes("submit_recruitment_application"), 'Recruitment API is not using the atomic rate-limited submission function');
assert(publicApi.includes("status: 429"), 'Recruitment API does not return HTTP 429 when rate limited');
assert(publicApi.includes('Retry-After'), 'Recruitment API does not expose Retry-After');
assert(!publicApi.includes("from('recruitment_applications').insert"), 'Recruitment API still performs a direct table insert');

const adminApi = read('app/api/admin/recruitment/route.ts');
assert(adminApi.includes('ensureAdmin'), 'Recruitment admin API gate is missing');
assert(adminApi.includes('private') || adminApi.includes('admin_users'), 'Recruitment admin authorization path is missing');

const packageJson = JSON.parse(read('package.json'));
assert(packageJson.scripts?.verify?.includes('verify-recruitment.mjs'), 'Recruitment verification is not wired into npm verify');

if (failures.length) {
  console.error('RECRUITMENT VERIFY: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('RECRUITMENT VERIFY: PASS');
console.log('- Public application form/API: present');
console.log('- Atomic database rate limiter: present');
console.log('- Admin inbox/API: present');
console.log('- Historical RLS/grants migration: present');
