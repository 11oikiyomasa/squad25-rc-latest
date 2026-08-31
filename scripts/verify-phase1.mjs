import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) failures.push(message); };

const funnel = read('lib/funnel/state.ts');
for (const state of [
  'FUNNEL_VISITOR', 'FUNNEL_DEEP_LINK_MEMBER_ENTRY', 'FUNNEL_MEMBER_PAGE', 'FUNNEL_JOIN_CTA',
  'FUNNEL_RECRUITMENT_DEEP_LINK_ENTRY', 'FUNNEL_RECRUITMENT_FORM', 'FUNNEL_RECRUITMENT_CLOSED',
  'FUNNEL_SUBMISSION_ERROR', 'FUNNEL_SUBMISSION_SUCCESS', 'FUNNEL_ADMIN_INBOX', 'FUNNEL_MEMBER_NOT_FOUND',
]) assert(funnel.includes(state), `Phase 1 funnel state missing: ${state}`);
for (const transition of [
  'SELECT_PUBLIC_MEMBER', 'OPEN_MEMBER_DEEP_LINK', 'PUBLIC_MEMBER_EXISTS', 'PUBLIC_MEMBER_UNAVAILABLE',
  'SELECT_JOIN_CTA_WHILE_OPEN', 'OPEN_RECRUITMENT_ROUTE', 'OPEN_RECRUITMENT_DEEP_LINK',
  'RECRUITMENT_CYCLE_OPEN', 'RECRUITMENT_CYCLE_CLOSED', 'SUBMISSION_PERSISTED', 'SUBMISSION_FAILED',
  'RETRY_SUBMISSION', 'APPLICATION_AVAILABLE_TO_ADMIN', 'NEW_OPEN_CYCLE_AVAILABLE',
]) assert(funnel.includes(transition), `Phase 1 funnel transition missing: ${transition}`);
assert(funnel.includes('canTransition'), 'Phase 1 transition guard missing');

const member = read('app/roster/[member_id]/page.tsx');
assert(member.includes('notFound()'), 'Public member deep-link missing not-found boundary');
assert(member.includes('getSquadContent()'), 'Public member page is not backed by public roster content');
assert(member.includes('hasEligibleRecruitmentOpening()'), 'Member Join CTA is not tied to recruitment availability');
assert(member.includes('href="/recruitment"'), 'Member Join CTA does not bridge into recruitment');

const recruitment = read('app/recruitment/page.tsx');
assert(recruitment.includes('getEligibleRecruitmentOpenings'), 'Recruitment index does not use canonical eligibility resolver');
assert(recruitment.includes('No open positions.'), 'Recruitment CLOSED empty state missing');
assert(recruitment.includes('/recruitment/closed'), 'Recruitment index does not expose canonical CLOSED state');

const closed = read('app/recruitment/closed/page.tsx');
assert(closed.includes('Recruitment closed'), 'Canonical CLOSED surface missing');
assert(closed.includes('No open trial.'), 'Canonical CLOSED surface lacks explicit closed messaging');

const apply = read('app/recruitment/[slug]/apply/page.tsx');
assert(apply.includes('getRecruitmentOpeningState'), 'Application route lacks authoritative opening resolver');
assert(apply.includes("redirect('/recruitment/closed')"), 'Closed opening does not enter canonical CLOSED state');
assert(apply.includes('notFound()'), 'Missing opening does not enter not-found boundary');
assert(apply.includes('<RecruitmentForm'), 'Eligible opening does not reach recruitment form');

const admin = read('lib/admin-auth.ts');
assert(admin.includes("redirect('/403')"), 'Admin authorization boundary missing');
const proxy = read('lib/supabase/proxy.ts');
assert(proxy.includes("pathname.startsWith('/admin')"), 'Admin page perimeter missing');
assert(proxy.includes("pathname.startsWith('/api/admin/')"), 'Admin API perimeter missing');
assert(proxy.includes('ROLE_ADMIN'), 'Admin role authorization missing');

const route = read('app/api/recruitment/route.ts');
assert(route.includes('SCHEMA_APPLICATION_SUBMISSION_V1.safeParse'), 'Server validation missing from submission boundary');
assert(route.includes('const writeResult = await persist('), 'Submission success is not persistence-backed');
assert(!route.includes("from('recruitment_applications').insert"), 'Direct client Application INSERT detected');

const writer = read('lib/recruitment/server-write.ts');
assert(writer.includes('assertOpeningEligible'), 'Server submission eligibility guard missing');
assert(writer.includes('submit_recruitment_application_v7'), 'Authoritative persistence RPC missing');

const publicState = read('lib/recruitment/public-state.ts');
assert(publicState.includes("cycle.status === 'OPEN'"), 'Public opening resolver does not require OPEN cycle');
assert(publicState.includes('job.is_active'), 'Public opening resolver does not require active opening');
assert(publicState.includes('cycle.closes_at'), 'Public opening resolver does not enforce cycle close time');
assert(publicState.includes('job.closes_at'), 'Public opening resolver does not enforce opening close time');
assert(publicState.includes('getEligibleRecruitmentOpenings'), 'Shared public opening list resolver missing');

if (failures.length) {
  console.error('PHASE 1 VERIFY: FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('PHASE 1 VERIFY: PASS');
console.log('- Canonical funnel state machine: present');
console.log('- Public member deep-link boundary: present');
console.log('- Recruitment OPEN/CLOSED resolver: present');
console.log('- Server-authoritative submission boundary: present');
console.log('- ADMIN-only private boundary: present');
