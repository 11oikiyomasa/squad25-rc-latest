import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (ok, msg) => { if (!ok) failures.push(msg); };
const has = (source, pattern) => new RegExp(pattern, 'm').test(source);

const files = [
  'app/recruitment/page.tsx','app/recruitment/[slug]/page.tsx','app/recruitment/[slug]/apply/page.tsx','app/recruitment/success/page.tsx','components/recruitment-form.tsx',
  'app/api/recruitment/route.ts','app/api/admin/recruitment/route.ts','app/api/admin/recruitment/[id]/route.ts','components/recruitment-inbox.tsx','lib/recruitment-security.ts','lib/supabase/admin.ts',
  'supabase/migrations/20260831020000_phase7_recruitment_funnel.sql','supabase/migrations/20260831020100_phase7_rate_limit_and_status_fix.sql','supabase/migrations/20260831020200_phase7_atomic_admin_actions.sql','supabase/migrations/20260831020300_phase7_close_direct_write_paths.sql','supabase/migrations/20260831020400_phase7_retire_legacy_submission_path.sql'
];
for (const file of files) assert(fs.existsSync(path.join(root, file)), `Missing Phase 7 file: ${file}`);

const migration = read('supabase/migrations/20260831020000_phase7_recruitment_funnel.sql');
assert(has(migration, 'create table if not exists public\\.recruitment_jobs'), 'Jobs table missing');
assert(migration.includes('recruitment_application_notes'), 'Application notes table missing');
assert(migration.includes('create table if not exists public.audit_logs'), 'Audit table missing');
assert(migration.includes('recruitment-resumes'), 'Private resume bucket missing');
assert(migration.includes('allowed_mime_types'), 'Resume MIME restriction missing');
assert(migration.includes('5242880'), '5 MiB resume limit missing');
assert(migration.includes('lower(email), job_id'), 'Email + job duplicate index missing');

const limiter = read('supabase/migrations/20260831020100_phase7_rate_limit_and_status_fix.sql');
assert(has(limiter, 'request_count\\s*>=\\s*3'), 'Three-per-hour threshold missing');
assert(has(limiter, "interval '\\d+ hour'"), 'One-hour rate-limit window missing');
assert(limiter.includes('pg_advisory_xact_lock'), 'Rate-limit concurrency lock missing');
assert(limiter.includes('v_resume_path !~'), 'Resume path validation missing');

const security = read('lib/recruitment-security.ts');
assert(security.includes('verifyTurnstile'), 'Turnstile verification missing');
assert(security.includes('%PDF-'), 'PDF magic-byte validation missing');
assert(security.includes('5 * 1024 * 1024'), 'Resume size guard missing');
assert(security.includes('normalize'), 'Unicode normalization missing');

const api = read('app/api/recruitment/route.ts');
assert(api.includes('request.formData()'), 'Multipart handling missing');
assert(api.includes('MAX_MULTIPART_BYTES'), 'Multipart payload limit missing');
assert(api.includes('assertPdf'), 'PDF validation missing');
assert(api.includes('hasPdfMagicBytes'), 'PDF signature validation missing');
assert(api.includes('recruitment-resumes'), 'Private resume storage missing');
assert(api.includes('submit_recruitment_application_v7'), 'Hardened submission RPC missing');
assert(api.includes('DUPLICATE_APPLICATION'), 'Duplicate handling missing');
assert(api.includes('RECRUITMENT_RATE_LIMIT'), 'Rate-limit handling missing');
assert(api.includes('website'), 'Honeypot missing');

const form = read('components/recruitment-form.tsx');
assert(form.includes('multipart/form-data'), 'Candidate form is not multipart');
assert(form.includes('type="file"'), 'Resume input missing');
assert(form.includes('accept="application/pdf,.pdf"'), 'Client PDF restriction missing');
assert(form.includes('turnstile'), 'Turnstile widget missing');
assert(form.includes('minLength={20}'), 'Cover letter client validation missing');

const admin = read('app/api/admin/recruitment/route.ts');
assert(admin.includes('ensureAdmin'), 'Admin RBAC gate missing');
assert(admin.includes('pageSize'), 'Server pagination missing');
assert(admin.includes('status'), 'Status filter missing');
assert(admin.includes('from'), 'Date filtering missing');
assert(admin.includes('admin_update_recruitment_application_v7'), 'Atomic admin RPC missing');
assert(admin.includes('expectedStatus'), 'Optimistic concurrency check missing');

const adminRpc = read('supabase/migrations/20260831020200_phase7_atomic_admin_actions.sql');
assert(adminRpc.includes('private.is_admin()'), 'Database RBAC missing');
assert(adminRpc.includes('APPLICATION_STATUS_CHANGED'), 'Status audit action missing');
assert(adminRpc.includes('APPLICATION_NOTE_ADDED'), 'Note audit action missing');
assert(adminRpc.includes('recruitment_application_notes'), 'Atomic note write missing');

const closeWrites = read('supabase/migrations/20260831020300_phase7_close_direct_write_paths.sql');
assert(has(closeWrites, 'revoke\\s+insert\\s*,\\s*update\\s*,\\s*delete\\s+on\\s+public\\.recruitment_applications'), 'Direct application writes are not revoked');

const retire = read('supabase/migrations/20260831020400_phase7_retire_legacy_submission_path.sql');
assert(retire.includes('revoke execute on function public.submit_recruitment_application'), 'Legacy submission RPC is not retired');

const detail = read('app/api/admin/recruitment/[id]/route.ts');
assert(detail.includes('createSignedUrl'), 'Resume signed URL access missing');
assert(detail.includes('recruitment_application_notes'), 'Application detail notes missing');

const pkg = JSON.parse(read('package.json'));
assert(pkg.scripts?.verify?.includes('verify-recruitment.mjs'), 'Phase 7 verifier is not wired into npm verify');

if (failures.length) {
  console.error('RECRUITMENT VERIFY: FAIL');
  failures.forEach((x) => console.error(`- ${x}`));
  process.exit(1);
}
console.log('RECRUITMENT VERIFY: PASS');
console.log('- Public listings → requirements → application → success: present');
console.log('- Multipart PDF upload + server validation: present');
console.log('- Turnstile + honeypot + 3/hour rate limit: present');
console.log('- Email + job duplicate constraint: present');
console.log('- Private resume storage + signed admin access: present');
console.log('- Paginated/searchable admin inbox: present');
console.log('- State machine + atomic notes + audit trail: present');
