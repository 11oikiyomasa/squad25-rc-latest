import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const failures = [];

function read(file) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) {
    failures.push(`Missing required verification target: ${file}`);
    return '';
  }
  return fs.readFileSync(absolute, 'utf8');
}

function assert(ok, message) {
  if (!ok) failures.push(message);
}

function allMigrationSql() {
  const directory = path.join(root, 'supabase', 'migrations');
  if (!fs.existsSync(directory)) return '';
  return fs.readdirSync(directory)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => fs.readFileSync(path.join(directory, name), 'utf8'))
    .join('\n');
}

const requiredFiles = [
  'app/recruitment/page.tsx',
  'app/recruitment/[slug]/page.tsx',
  'app/recruitment/[slug]/apply/page.tsx',
  'app/recruitment/closed/page.tsx',
  'app/recruitment/success/page.tsx',
  'components/recruitment-form.tsx',
  'app/api/recruitment/route.ts',
  'lib/recruitment/schema.ts',
  'lib/recruitment/file-probe.ts',
  'lib/recruitment/server-write.ts',
  'lib/recruitment/public-state.ts',
  'lib/recruitment-security.ts',
  'lib/security/rate-limit.ts',
  'lib/security/origin.ts',
  'lib/security/body-limit.ts',
  'lib/security/error-response.ts',
  'lib/supabase/proxy.ts',
  'lib/supabase/admin.ts',
  'types/database.ts',
  'supabase/migrations/20260831112000_phase7_submission_runtime_contract.sql',
];
for (const file of requiredFiles) read(file);

const schema = read('lib/recruitment/schema.ts');
for (const field of [
  'job_id', 'full_name', 'nickname', 'email', 'phone', 'role',
  'portfolio_link', 'resume', 'cover_letter', 'turnstile_token', 'honeypot_website',
]) assert(schema.includes(field), `Submission schema field missing: ${field}`);
assert(schema.includes('SCHEMA_APPLICATION_SUBMISSION_V1'), 'Canonical Zod submission schema missing');
assert(schema.includes('z.enum(APPLICATION_ROLES)'), 'Closed recruitment role enum missing');
assert(schema.includes('toLowerCase'), 'Email normalization missing');
assert(schema.includes('.strict()'), 'Strict submission payload schema missing');

const security = read('lib/recruitment-security.ts');
assert(security.includes('verifyTurnstile'), 'Turnstile server verification missing');
assert(security.includes('MAX_RESUME_BYTES = 5 * 1024 * 1024'), '5 MiB resume limit missing');
assert(security.includes("file.type !== 'application/pdf'"), 'PDF MIME validation missing');
assert(security.includes("endsWith('.pdf')"), 'PDF extension validation missing');
assert(security.includes("=== '%PDF-'"), 'PDF magic-byte validation missing');
assert(security.includes('normalize'), 'Unicode normalization missing');
assert(security.includes('clientIp'), 'Trusted client-IP extraction missing');

const fileProbe = read('lib/recruitment/file-probe.ts');
assert(fileProbe.includes("RECRUITMENT_RESUME_BUCKET = 'recruitment-resumes'"), 'Private resume bucket binding missing');
assert(fileProbe.includes("RECRUITMENT_RESUME_MIME = 'application/pdf'"), 'Canonical resume MIME contract missing');
assert(fileProbe.includes('probeRecruitmentResume'), 'Resume probe entry point missing');

const route = read('app/api/recruitment/route.ts');
assert(route.includes('request.formData()'), 'Multipart handling missing');
assert(route.includes('7 * 1024 * 1024'), '7 MiB application multipart ceiling missing');
assert(route.includes('SCHEMA_APPLICATION_SUBMISSION_V1.safeParse'), 'Canonical route does not execute Zod schema');
assert(route.includes('probeRecruitmentResume'), 'Canonical route does not execute file probe');
assert(route.includes('verifyTurnstile'), 'Canonical route does not execute anti-abuse verification');
assert(route.includes('const writeResult = await persist('), 'Canonical POST does not reach write wrapper');
const postStart = route.indexOf('export async function POST');
assert(postStart >= 0, 'Canonical POST handler missing');
if (postStart >= 0) {
  const postBody = route.slice(postStart);
  const zodPos = postBody.indexOf('SCHEMA_APPLICATION_SUBMISSION_V1.safeParse');
  const probePos = postBody.indexOf('probeRecruitmentResume', zodPos + 1);
  const turnstilePos = postBody.indexOf('verifyTurnstile', probePos + 1);
  const writePos = postBody.indexOf('const writeResult = await persist(', turnstilePos + 1);
  assert(zodPos >= 0 && probePos > zodPos && turnstilePos > probePos && writePos > turnstilePos, 'Submission pipeline order changed inside POST handler');
}
assert(!route.includes("from('recruitment_applications').insert"), 'Direct Application INSERT write path detected');

const writer = read('lib/recruitment/server-write.ts');
assert(writer.includes("import 'server-only'"), 'Server write boundary is not server-only');
assert(writer.includes('createAdminClient'), 'Privileged write does not use server admin client');
assert(writer.includes('assertOpeningEligible'), 'Server opening eligibility guard missing');
assert(writer.includes('assertNotDuplicate'), 'Server duplicate guard missing');
assert(writer.includes('RECRUITMENT_RESUME_BUCKET'), 'Server writer is not bound to canonical private resume bucket');
assert(writer.includes('submit_recruitment_application_v7'), 'Canonical submission RPC missing');
assert(writer.includes('storage.from(RECRUITMENT_RESUME_BUCKET)'), 'Resume upload does not use canonical bucket');
assert(writer.includes('storage.from(RECRUITMENT_RESUME_BUCKET).remove'), 'Failed persistence cleanup missing');

const runtimeRpc = read('supabase/migrations/20260831112000_phase7_submission_runtime_contract.sql');
assert(runtimeRpc.includes('submit_recruitment_application_v7'), 'Runtime submission RPC migration missing');
assert(runtimeRpc.includes("auth.role() <> 'service_role'"), 'Submission RPC service-role guard missing');
assert(runtimeRpc.includes('RECRUITMENT_CLOSED'), 'RPC recruitment eligibility failure missing');
assert(runtimeRpc.includes('DUPLICATE_APPLICATION'), 'RPC duplicate failure missing');
assert(runtimeRpc.includes("bucket_id = 'recruitment-resumes'"), 'RPC private resume bucket binding missing');

const migrations = allMigrationSql();
for (const table of [
  'squad_settings', 'members', 'montages', 'achievements', 'gallery_items', 'admin_users',
  'recruitment_cycles', 'recruitment_jobs', 'recruitment_applications',
  'recruitment_application_notes', 'audit_logs',
]) assert(migrations.includes(table), `Phase 9 table contract missing: ${table}`);
assert(migrations.includes("status in ('NEW','REVIEWING','SHORTLISTED','ACCEPTED','REJECTED')"), 'Closed Application status set missing');
assert(migrations.includes('recruitment_applications_email_job_uidx'), 'Normalized email + opening unique index missing');
assert(migrations.includes('lower(email), job_id'), 'Normalized email + opening unique definition missing');
assert(migrations.includes("'recruitment-resumes'"), 'Private resume bucket contract missing');
assert(migrations.includes("'squad-media'"), 'Squad media bucket contract missing');
assert(migrations.includes('5242880'), '5 MiB storage limit missing');
assert(migrations.includes('8388608'), '8 MiB media storage limit missing');
assert(migrations.includes('on public.recruitment_applications for select to authenticated'), 'Admin Application SELECT policy missing');
assert(migrations.includes('revoke select, insert, update, delete on public.recruitment_applications from anon'), 'Anon Application direct privileges not revoked');
assert(migrations.includes('revoke insert, update, delete on public.recruitment_applications from authenticated'), 'Authenticated Application direct write privileges not revoked');

const privileges = read('supabase/migrations/20260831100100_phase9_privileges.sql');
assert(/revoke/i.test(privileges), 'Privilege revocation contract missing');
assert(/grant/i.test(privileges), 'Required role grant contract missing');

const rateLimit = read('lib/security/rate-limit.ts');
assert(rateLimit.includes('RATE_APPLICATION_BURST = 3'), '3/30s burst rate limit missing');
assert(rateLimit.includes('RATE_APPLICATION_BURST_WINDOW_SECONDS = 30'), '30 second burst window missing');
assert(rateLimit.includes('RATE_APPLICATION_WINDOW = 5'), '5/10m rate limit missing');
assert(rateLimit.includes('RATE_APPLICATION_WINDOW_SECONDS = 10 * 60'), '10 minute rate window missing');
assert(rateLimit.includes('unavailable: true'), 'Rate limiter fail-closed state missing');
assert(rateLimit.includes('catch'), 'Rate limiter dependency failure handling missing');

const proxy = read('lib/supabase/proxy.ts');
const ratePos = proxy.indexOf('checkRecruitmentRateLimit(request)');
const originPos = proxy.indexOf('hasValidRecruitmentOrigin(request)');
const bodyPos = proxy.indexOf('exceedsRequestBodyLimit(request)');
assert(ratePos >= 0 && originPos > ratePos && bodyPos > originPos, 'Recruitment security perimeter order changed');
assert(proxy.includes("pathname.startsWith('/admin')"), 'Admin page gate missing');
assert(proxy.includes("pathname.startsWith('/api/admin/')"), 'Admin API gate missing');
assert(proxy.includes("'/login'"), 'Unauthenticated Admin redirect missing');
assert(proxy.includes('ROLE_ADMIN'), 'Admin role gate missing');

const origin = read('lib/security/origin.ts');
assert(origin.includes('if (!origin || !expected) return false'), 'Missing/invalid Origin is not rejected');
assert(origin.includes('new URL(origin).origin === expected'), 'Foreign Origin comparison missing');

const bodyLimit = read('lib/security/body-limit.ts');
assert(bodyLimit.includes('8 * 1024 * 1024'), '8 MiB host/body boundary missing');

const errors = read('lib/security/error-response.ts');
for (const code of ['INVALID_REQUEST', 'AUTH_REQUIRED', 'FORBIDDEN', 'SEC_INVALID_ORIGIN', 'PAYLOAD_TOO_LARGE', 'RATE_LIMITED', 'RATE_LIMIT_UNAVAILABLE', 'INTERNAL_ERROR']) {
  assert(errors.includes(`'${code}'`), `Security error mapping missing: ${code}`);
}
for (const status of ['400', '401', '403', '413', '429', '500']) assert(errors.includes(status), `HTTP error mapping missing: ${status}`);
assert(!errors.includes('stack'), 'Stack trace disclosure detected in error mapping');

const adminClient = read('lib/supabase/admin.ts');
assert(adminClient.includes("import 'server-only'"), 'Admin Supabase client missing server-only boundary');
assert(adminClient.includes('SUPABASE_SERVICE_ROLE_KEY'), 'Service-role key boundary missing');

const publicState = read('lib/recruitment/public-state.ts');
assert(publicState.includes("cycle.status === 'OPEN'"), 'Public recruitment Cycle OPEN check missing');
assert(publicState.includes('job.is_active'), 'Public recruitment active-opening check missing');
assert(publicState.includes('job.closes_at'), 'Public recruitment opening close-time check missing');
assert(publicState.includes('cycle.closes_at'), 'Public recruitment cycle close-time check missing');

const apply = read('app/recruitment/[slug]/apply/page.tsx');
assert(apply.includes('getRecruitmentOpeningState'), 'Apply route does not use server-side opening eligibility resolver');
assert(apply.includes('/recruitment/closed'), 'Apply route missing canonical CLOSED redirect');
assert(apply.includes('notFound()'), 'Missing opening is not a 404');

const dbTypes = read('types/database.ts');
assert(dbTypes.includes('export type Database ='), 'Generated Database type authority missing');
assert(dbTypes.includes('recruitment_applications'), 'Generated Application table type missing');

const clientRoots = ['app', 'components', 'lib'];
function walk(directory) {
  const absolute = path.join(root, directory);
  if (!fs.existsSync(absolute)) return [];
  const files = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(child));
    else if (/\.(tsx|ts)$/.test(entry.name)) files.push(child);
  }
  return files;
}
for (const file of clientRoots.flatMap(walk)) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  if (source.includes("'use client'") || source.includes('"use client"')) {
    assert(!source.includes('createAdminClient'), `Client module imports privileged Supabase client: ${file}`);
    assert(!source.includes('SUPABASE_SERVICE_ROLE_KEY'), `Client module references service-role key: ${file}`);
  }
}

const pkg = JSON.parse(read('package.json'));
assert(pkg.dependencies?.zod === '4.5.4', 'package.json is missing canonical Zod version');
assert(pkg.scripts?.verify?.includes('verify-recruitment.mjs'), 'Recruitment verifier is not wired into npm verify');

if (failures.length) {
  console.error('RECRUITMENT VERIFY: FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('RECRUITMENT VERIFY: PASS');
console.log('- Canonical recruitment submission boundary: present');
console.log('- Zod → file probe → Turnstile → server-only persistence order: present');
console.log('- Server-side recruitment eligibility + duplicate guards: present');
console.log('- Phase 9 Application/RLS/storage invariants: present');
console.log('- Phase 10 rate-limit/origin/body/error perimeter: present');
console.log('- Admin/service-role boundary: present');
console.log('- Generated Database type authority: present');
