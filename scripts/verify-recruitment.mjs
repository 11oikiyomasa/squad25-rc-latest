import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const failures = [];
const read = (file) => {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) {
    failures.push(`Missing required verification target: ${file}`);
    return '';
  }
  return fs.readFileSync(absolute, 'utf8');
};
const assert = (ok, msg) => { if (!ok) failures.push(msg); };
const has = (source, pattern) => new RegExp(pattern, 'm').test(source);

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
  'supabase/migrations/20260831100054_phase9_schema_rls_storage.sql',
  'supabase/migrations/20260831100100_phase9_privileges.sql',
  'supabase/migrations/20260831100519_phase9_achievement_updated_at.sql',
  'supabase/migrations/20260831112000_phase7_submission_runtime_contract.sql',
];
requiredFiles.forEach((file) => read(file));

const schema = read('lib/recruitment/schema.ts');
assert(schema.includes('SCHEMA_APPLICATION_SUBMISSION_V1'), 'Canonical Zod submission schema missing');
for (const field of ['job_id', 'full_name', 'nickname', 'email', 'phone', 'role', 'portfolio_link', 'resume', 'cover_letter', 'turnstile_token', 'honeypot_website']) {
  assert(schema.includes(field), `Submission schema field missing: ${field}`);
}
assert(schema.includes("z.enum(APPLICATION_ROLES)"), 'Closed recruitment role enum missing');
assert(schema.includes("z.string().email().max(254)"), 'Server email validation missing');
assert(schema.includes('toLowerCase'), 'Email normalization missing');
assert(schema.includes('.strict()'), 'Strict submission payload schema missing');

const fileProbe = read('lib/recruitment/file-probe.ts');
assert(fileProbe.includes("RECRUITMENT_RESUME_BUCKET = 'recruitment-resumes'"), 'Private resume bucket binding missing');
assert(fileProbe.includes('5 * 1024 * 1024'), '5 MiB resume size guard missing');
assert(fileProbe.includes("application/pdf"), 'PDF MIME validation missing');
assert(fileProbe.includes(".pdf"), 'PDF extension validation missing');
assert(fileProbe.includes("%PDF-"), 'PDF magic-byte validation missing');

const security = read('lib/recruitment-security.ts');
assert(security.includes('verifyTurnstile'), 'Turnstile server verification missing');
assert(security.includes('%PDF-'), 'Legacy/server PDF signature helper missing');
assert(security.includes('normalize'), 'Unicode normalization helper missing');
assert(security.includes('clientIp'), 'Trusted client-IP extraction missing');

const route = read('app/api/recruitment/route.ts');
assert(has(route, "SCHEMA_APPLICATION_SUBMISSION_V1\\.safeParse"), 'Canonical route does not execute Zod schema');
assert(route.includes('probeRecruitmentResume'), 'Canonical route does not execute resume probe');
assert(route.includes('verifyTurnstile'), 'Canonical route does not execute Turnstile verification');
assert(route.includes('persistApplicationSubmission'), 'Canonical route does not use server write boundary');
assert(has(route, 'request\\.formData\\(\\)'), 'Multipart form parsing missing');
assert(route.includes('7 * 1024 * 1024'), 'Application multipart 7 MiB limit missing');
assert(has(route, 'SCHEMA_APPLICATION_SUBMISSION_V1\\.safeParse[\\s\\S]*probeRecruitmentResume[\\s\\S]*verifyTurnstile[\\s\\S]*persistApplicationSubmission'), 'Submission pipeline order changed');
assert(!route.includes("from('recruitment_applications').insert"), 'Direct Application INSERT write path detected');
assert(!route.includes('.insert({'), 'Direct INSERT write path detected in recruitment route');

const writer = read('lib/recruitment/server-write.ts');
assert(writer.includes("import 'server-only'"), 'Server write boundary is not server-only');
assert(writer.includes('createAdminClient'), 'Privileged write does not use server admin client');
assert(writer.includes('assertOpeningEligible'), 'Server eligibility guard missing');
assert(writer.includes('assertNotDuplicate'), 'Server duplicate guard missing');
assert(writer.includes('recruitment-resumes'), 'Writer is not bound to private resume bucket');
assert(writer.includes('submit_recruitment_application_v7'), 'Canonical submission RPC missing');
assert(writer.includes('APPLICATION_CLOSED'), 'Ineligible opening server outcome missing');
assert(writer.includes('APPLICATION_DUPLICATE'), 'Duplicate server outcome missing');
assert(writer.includes('storage.from(RECRUITMENT_RESUME_BUCKET)'), 'Resume write is not using canonical bucket');
assert(writer.includes('storage.from(RECRUITMENT_RESUME_BUCKET).remove'), 'Failed persistence cleanup missing');

const rpcMigration = read('supabase/migrations/20260831112000_phase7_submission_runtime_contract.sql');
assert(rpcMigration.includes('submit_recruitment_application_v7'), 'Runtime submission RPC migration missing');
assert(rpcMigration.includes("auth.role() <> 'service_role'"), 'Submission RPC service-role guard missing');
assert(rpcMigration.includes('RECRUITMENT_CLOSED'), 'RPC recruitment eligibility failure missing');
assert(rpcMigration.includes('DUPLICATE_APPLICATION'), 'RPC duplicate failure missing');
assert(rpcMigration.includes("bucket_id = 'recruitment-resumes'"), 'RPC private resume bucket binding missing');
assert(rpcMigration.includes('resume_path'), 'RPC resume path binding missing');

const phase9 = read('supabase/migrations/20260831100054_phase9_schema_rls_storage.sql');
assert(phase9.includes('create table if not exists public.squad_settings'), 'squad_settings table missing');
assert(phase9.includes('create table if not exists public.members'), 'members table missing');
assert(phase9.includes('create table if not exists public.montages'), 'montages table missing');
assert(phase9.includes('create table if not exists public.achievements'), 'achievements table missing');
assert(phase9.includes('create table if not exists public.gallery_items'), 'gallery_items table missing');
assert(phase9.includes('create table if not exists public.admin_users'), 'admin_users table missing');
assert(phase9.includes('create table if not exists public.recruitment_cycles'), 'recruitment_cycles table missing');
assert(phase9.includes('create table if not exists public.recruitment_jobs'), 'recruitment_jobs table missing');
assert(phase9.includes('create table if not exists public.recruitment_applications'), 'recruitment_applications table missing');
assert(phase9.includes('create table if not exists public.recruitment_application_notes'), 'recruitment_application_notes table missing');
assert(phase9.includes('create table if not exists public.audit_logs'), 'audit_logs table missing');
assert(phase9.includes("status TEXT NOT NULL DEFAULT 'NEW'"), 'Application initial NEW status missing');
assert(phase9.includes("status IN ('NEW','REVIEWING','SHORTLISTED','ACCEPTED','REJECTED')"), 'Application closed status set missing');
assert(phase9.includes('recruitment_applications_email_job_uidx'), 'Normalized email + opening unique index missing');
assert(phase9.includes('lower(email), job_id'), 'Normalized email + opening unique definition missing');
assert(phase9.includes("'recruitment-resumes'"), 'Private resume bucket migration missing');
assert(phase9.includes("'squad-media'"), 'Public squad-media bucket migration missing');
assert(phase9.includes('5242880'), 'Resume storage 5 MiB limit missing');
assert(phase9.includes('8388608'), 'Squad media 8 MiB limit missing');

const privileges = read('supabase/migrations/20260831100100_phase9_privileges.sql');
assert(privileges.includes('recruitment_applications'), 'Application privilege hardening missing');
assert(privileges.includes('REVOKE'), 'Privilege revocation missing');
assert(privileges.includes('GRANT'), 'Required role grants missing');

const rateLimit = read('lib/security/rate-limit.ts');
assert(rateLimit.includes('RATE_APPLICATION_BURST = 3'), '3/30s burst rate limit missing');
assert(rateLimit.includes('RATE_APPLICATION_BURST_WINDOW_SECONDS = 30'), '30 second burst window missing');
assert(rateLimit.includes('RATE_APPLICATION_WINDOW = 5'), '5/10m rate limit missing');
assert(rateLimit.includes('RATE_APPLICATION_WINDOW_SECONDS = 10 * 60'), '10 minute rate window missing');
assert(rateLimit.includes('unavailable: true'), 'Rate limiter fail-closed state missing');
assert(rateLimit.includes('catch'), 'Rate limiter dependency failure handling missing');

const origin = read('lib/security/origin.ts');
assert(origin.includes("if (!origin || !expected) return false"), 'Missing/invalid Origin is not rejected');
assert(origin.includes('new URL(origin).origin === expected'), 'Foreign Origin comparison missing');

const bodyLimit = read('lib/security/body-limit.ts');
assert(bodyLimit.includes('8 * 1024 * 1024'), '8 MiB host/body boundary missing');

const errors = read('lib/security/error-response.ts');
for (const code of ['INVALID_REQUEST', 'AUTH_REQUIRED', 'FORBIDDEN', 'SEC_INVALID_ORIGIN', 'PAYLOAD_TOO_LARGE', 'RATE_LIMITED', 'RATE_LIMIT_UNAVAILABLE', 'INTERNAL_ERROR']) {
  assert(errors.includes(`'${code}'`), `Security error mapping missing: ${code}`);
}
assert(errors.includes('413'), '413 mapping missing');
assert(errors.includes('429'), '429 mapping missing');
assert(errors.includes('500'), '500 mapping missing');
assert(!errors.includes('stack'), 'Stack trace disclosure detected in error mapping');

const proxy = read('lib/supabase/proxy.ts');
assert(proxy.includes('checkRecruitmentRateLimit'), 'Recruitment rate limiter is not wired into proxy');
assert(proxy.includes('hasValidRecruitmentOrigin'), 'Recruitment Origin check is not wired into proxy');
assert(proxy.includes('exceedsRequestBodyLimit'), 'Host/body limit is not wired into proxy');
assert(has(proxy, 'checkRecruitmentRateLimit\\(request\\)[\\s\\S]*hasValidRecruitmentOrigin\\(request\\)[\\s\\S]*exceedsRequestBodyLimit\\(request\\)'), 'Security perimeter order changed');
assert(proxy.includes("if (isAdminRoute || isAdminApiRoute)"), 'Admin route classification missing');
assert(proxy.includes("pathname.startsWith('/admin')"), 'Admin page gate missing');
assert(proxy.includes("pathname.startsWith('/api/admin/')"), 'Admin API gate missing');
assert(proxy.includes("'/login'"), 'Unauthenticated Admin redirect missing');
assert(proxy.includes("ROLE_ADMIN"), 'Admin role gate missing');

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

const pkg = JSON.parse(read('package.json'));
assert(pkg.dependencies?.zod === '4.5.4', 'package.json is missing canonical Zod version');
assert(pkg.scripts?.verify?.includes('verify-recruitment.mjs'), 'Recruitment verifier is not wired into npm verify');

const dbTypes = read('types/database.ts');
assert(dbTypes.includes('export type Database ='), 'Generated Database type authority missing');
assert(dbTypes.includes('recruitment_applications'), 'Generated Application table type missing');

if (failures.length) {
  console.error('RECRUITMENT VERIFY: FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('RECRUITMENT VERIFY: PASS');
console.log('- Canonical POST /api/recruitment path: present');
console.log('- Zod → file probe → Turnstile → server-only write boundary: present');
console.log('- Server-side recruitment eligibility + duplicate guards: present');
console.log('- Phase 9 Application/RLS/storage invariants: present');
console.log('- Phase 10 rate-limit/origin/body/error perimeter: present');
console.log('- Generated Database type authority: present');
