import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const failures = [];

const read = (file) => {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) {
    failures.push(`Missing Phase 1 contract target: ${file}`);
    return '';
  }
  return fs.readFileSync(absolute, 'utf8');
};

const exists = (file) => fs.existsSync(path.join(root, file));
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const contract = read('lib/product/contract.ts');
const funnel = read('lib/funnel/state.ts');

assert(contract.includes("PRODUCT_ID = 'SQUAD.25'"), 'Product ID is not locked to SQUAD.25');
assert(contract.includes('PRODUCT_ONE_LINER'), 'Product one-liner contract is missing');
assert((contract.match(/PRODUCT_ONE_LINER/g) ?? []).length === 1, 'Product one-liner has competing definitions');
assert(contract.includes('V1_NON_GOALS'), 'V1 non-goals contract is missing');

for (const persona of ['VISITOR', 'APPLICANT', 'ADMIN']) {
  assert(contract.includes(`${persona}: '${persona}'`), `Phase 1 persona missing: ${persona}`);
}

for (const state of [
  'FUNNEL_VISITOR',
  'FUNNEL_DEEP_LINK_MEMBER_ENTRY',
  'FUNNEL_MEMBER_PAGE',
  'FUNNEL_JOIN_CTA',
  'FUNNEL_RECRUITMENT_DEEP_LINK_ENTRY',
  'FUNNEL_RECRUITMENT_FORM',
  'FUNNEL_RECRUITMENT_CLOSED',
  'FUNNEL_SUBMISSION_ERROR',
  'FUNNEL_SUBMISSION_SUCCESS',
  'FUNNEL_ADMIN_INBOX',
  'FUNNEL_MEMBER_NOT_FOUND',
]) assert(funnel.includes(state), `Funnel state missing: ${state}`);

for (const transition of [
  'SELECT_PUBLIC_MEMBER',
  'OPEN_MEMBER_DEEP_LINK',
  'PUBLIC_MEMBER_EXISTS',
  'PUBLIC_MEMBER_UNAVAILABLE',
  'SELECT_JOIN_CTA_WHILE_OPEN',
  'OPEN_RECRUITMENT_ROUTE',
  'OPEN_RECRUITMENT_DEEP_LINK',
  'RECRUITMENT_CYCLE_OPEN',
  'RECRUITMENT_CYCLE_CLOSED',
  'SUBMISSION_PERSISTED',
  'SUBMISSION_FAILED',
  'RETRY_SUBMISSION',
  'APPLICATION_AVAILABLE_TO_ADMIN',
  'NEW_OPEN_CYCLE_AVAILABLE',
]) assert(funnel.includes(transition), `Funnel transition missing: ${transition}`);
assert(funnel.includes('canTransition'), 'Funnel transition guard missing');
assert(contract.includes('FUNNEL_TRANSITIONS'), 'Product contract does not expose the canonical funnel transition table');

for (const domainTerm of [
  'DOMAIN_MEMBER',
  'DOMAIN_ROSTER',
  'DOMAIN_APPLICANT',
  'DOMAIN_RECRUITMENT_CYCLE',
  'DOMAIN_RECRUITMENT_OPENING',
  'DOMAIN_APPLICATION',
  'DOMAIN_APPLICATION_STATUS',
  'DOMAIN_APPLICATION_NOTE',
  'DOMAIN_ADMIN',
  'DOMAIN_ADMIN_INBOX',
  'DOMAIN_SUBMISSION',
]) assert(contract.includes(domainTerm), `Domain glossary term missing: ${domainTerm}`);

for (const metric of [
  'METRIC_01_MEMBER_TO_JOIN_CONVERSION',
  'METRIC_02_RECRUITMENT_COMPLETION_RATE',
  'METRIC_03_VALID_SUBMISSION_SUCCESS_RATE',
  'METRIC_04_INBOX_AVAILABILITY_LATENCY',
  'METRIC_05_SECURITY_BOUNDARY_INTEGRITY',
]) assert(contract.includes(metric), `Success metric missing: ${metric}`);

for (const surface of [
  'SURFACE_HOME',
  'SURFACE_ROSTER',
  'SURFACE_MEMBER_PAGE',
  'SURFACE_RECRUITMENT',
  'SURFACE_RECRUITMENT_CLOSED',
  'SURFACE_RECRUITMENT_SUCCESS',
  'SURFACE_RECRUITMENT_ERROR',
  'SURFACE_PUBLIC_NOT_FOUND',
  'SURFACE_SCRIMS',
  'SURFACE_MATCHES',
  'SURFACE_MEDIA',
  'SURFACE_ADMIN_LOGIN',
  'SURFACE_ADMIN_INBOX',
  'SURFACE_ADMIN_RECRUITMENT',
  'SURFACE_ADMIN_ROSTER',
  'SURFACE_ADMIN_MEDIA',
  'SURFACE_ADMIN_MATCHES',
  'SURFACE_ADMIN_SCRIMS',
  'SURFACE_ADMIN_PREVIEW',
]) assert(contract.includes(surface), `Phase 1 surface missing: ${surface}`);

assert(contract.includes('MEMBER_IS_PUBLIC: true'), 'Member public visibility rule missing');
assert(contract.includes('MEMBER_DEEP_LINK_WHEN_RECRUITMENT_CLOSED'), 'Member deep-link closed-cycle rule missing');
assert(contract.includes("RECRUITMENT_CLOSED_STATE: FUNNEL_STATES.RECRUITMENT_CLOSED"), 'Recruitment CLOSED state rule missing');
assert(contract.includes('ADMIN_INBOX_PERSONA: PERSONAS.ADMIN'), 'Admin Inbox persona rule missing');
assert(contract.includes('APPLICANT_REQUIRES_PERSISTENT_ACCOUNT: false'), 'Applicant account requirement is not locked');

const requiredRoutes = [
  'app/page.tsx',
  'app/roster/page.tsx',
  'app/roster/[member_id]/page.tsx',
  'app/recruitment/page.tsx',
  'app/recruitment/[slug]/page.tsx',
  'app/recruitment/[slug]/apply/page.tsx',
  'app/recruitment/closed/page.tsx',
  'app/recruitment/success/page.tsx',
  'app/media/page.tsx',
  'app/matches/page.tsx',
  'app/matches/[match_id]/page.tsx',
  'app/scrims/page.tsx',
  'app/admin/overview/page.tsx',
  'app/admin/recruitment/page.tsx',
];
for (const route of requiredRoutes) assert(exists(route), `Phase 1 surface route missing: ${route}`);

const legacyMember = read('app/member/[id]/page.tsx');
assert(legacyMember.includes('redirect(`/roster/${encodeURIComponent(id)}`)'), 'Legacy Member deep-link does not resolve to canonical roster Member route');

const member = read('app/roster/[member_id]/page.tsx');
assert(member.includes('const member = members.find((item) => item.id === member_id);'), 'Member deep-link lookup is missing');
assert(member.includes('if (!member) return notFound();'), 'Unavailable Member does not resolve to Member Not Found');
assert(member.includes('priority />'), 'Member hero is not the priority image candidate');

const recruitment = read('app/recruitment/page.tsx');
assert(recruitment.includes('getEligibleRecruitmentOpenings'), 'Recruitment index does not use canonical eligibility resolver');
assert(recruitment.includes('No open positions.'), 'Recruitment CLOSED empty state missing');
assert(recruitment.includes('/recruitment/closed'), 'Recruitment index does not expose canonical CLOSED state');

const apply = read('app/recruitment/[slug]/apply/page.tsx');
assert(apply.includes('getRecruitmentOpeningState'), 'Application route lacks authoritative opening resolver');
assert(apply.includes("redirect('/recruitment/closed')"), 'Ineligible recruitment opening does not route to CLOSED');
assert(!apply.includes(".from('recruitment_applications')"), 'Apply route contains direct Application database access');

const closed = read('app/recruitment/closed/page.tsx');
assert(closed.includes('href="/recruitment"'), 'CLOSED state lacks recruitment recovery path');
assert(closed.includes('href="/roster"'), 'CLOSED state lacks roster recovery path');
assert(closed.includes('No other opening is selected automatically.'), 'CLOSED state does not communicate no automatic opening substitution');

const adminAuth = read('lib/admin-auth.ts');
assert(adminAuth.includes("redirect('/403')"), 'Admin persona boundary is missing non-admin denial');
assert(adminAuth.includes("redirect('/login?error=not_authenticated&next=%2Fadmin')"), 'Unauthenticated Admin access does not route to login');

const applicationAdmin = read('app/admin/recruitment/page.tsx');
assert(applicationAdmin.length > 0, 'Admin Inbox surface is empty');

for (const phrase of [
  'player social network',
  'public applicant-status tracking system',
  'automated hiring/scouting decision engine',
  'chat, direct-message, or community platform',
  'payment, commerce, tournament-bracket, or full esports operations platform',
  'general-purpose CMS',
]) assert(contract.includes(phrase), `V1 non-goal missing: ${phrase}`);

if (failures.length) {
  console.error('PRODUCT CONTRACT VERIFY: FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('PRODUCT CONTRACT VERIFY: PASS');
console.log('- SQUAD.25 product boundary: locked');
console.log('- Visitor / Applicant / Admin personas: locked');
console.log('- Canonical funnel state machine: present in lib/funnel/state.ts');
console.log('- Domain glossary and success metrics: locked');
console.log('- Public/admin surface inventory: locked');
console.log('- Member deep-link + CLOSED recruitment behavior: present');
