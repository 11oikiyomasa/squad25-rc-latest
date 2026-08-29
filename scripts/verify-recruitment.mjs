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
  'supabase/migrations/20260829040000_add_player_recruitment_applications.sql',
]) {
  assert(fs.existsSync(path.join(root, file)), `Missing recruitment file: ${file}`);
}

const migration = read('supabase/migrations/20260829040000_add_player_recruitment_applications.sql');
assert(migration.includes('create table if not exists public.recruitment_applications'), 'Recruitment table migration is missing');
assert(migration.includes("for insert\nto anon"), 'Anonymous recruitment insert policy is missing');
assert(migration.includes('private.is_admin()'), 'Admin recruitment authorization is missing');
assert(migration.includes('revoke all on table public.recruitment_applications from anon, authenticated'), 'Recruitment table privileges are not locked down');
assert(migration.includes('grant insert on table public.recruitment_applications to anon'), 'Public recruitment insert grant is missing');
assert(migration.includes('grant select, update on table public.recruitment_applications to authenticated'), 'Admin recruitment grants are missing');

const form = read('components/recruitment-form.tsx');
assert(form.includes("fetch('/api/recruitment'"), 'Recruitment form is not connected to the API');
assert(form.includes('website'), 'Recruitment honeypot field is missing');
assert(form.includes('Do not send') || form.includes('Jangan kirim password'), 'Sensitive-data warning is missing');

const publicApi = read('app/api/recruitment/route.ts');
assert(publicApi.includes("body.website"), 'Recruitment API does not evaluate the honeypot');
assert(publicApi.includes("status: 'NEW'"), 'Recruitment API does not force NEW status');
assert(publicApi.includes('new URL(socialUrl)'), 'Recruitment API URL validation is missing');

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
console.log('- Admin inbox/API: present');
console.log('- RLS/grants migration: present');
