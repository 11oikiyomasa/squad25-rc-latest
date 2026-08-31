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

assert(contract.includes("PRODUCT_ID = 'SQUAD.25'"), 'Product ID is not locked to SQUAD.25');
assert(contract.includes('PRODUCT_ONE_LINER'), 'Product one-liner contract is missing');
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
]) {
  assert(contract.includes(state), `Funnel state missing: ${state}`);
}
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
]) {
  assert(contract.includes(domainTerm), `Domain glossary term missing: ${domainTerm}`);
}
for (const metric of [
  'METRIC_01_MEMBER_TO_JOIN_CONVERSION',
  'METRIC_02_RECRUITMENT_COMPLETION_RATE',
  'METRIC_03_VALID_SUBMISSION_SUCCESS_RATE',
  'METRIC_04_INBOX_AVAILABILITY_LATENCY',
  'METRIC_05_SECURITY_BOUNDARY_INTEGRITY',
]) {
  assert(contract.includes(metric), `Success metric missing: ${metric}`);
}
assert(contract.includes('MEMBER_DEEP_LINK_WHEN_RECRUITMENT_CLOSED'), 'Member deep-link closed-cycle rule missing');
assert(contract.includes("RECRUITMENT_CLOSED_STATE: 'FUNNEL_RECRUITMENT_CLOSED'"), 'Recruitment CLOSED state rule missing');
assert(contract.includes('ADMIN_INBOX_PERSONA'), 'Admin Inbox role contract missing');
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

const apply = read('app/recruitment/[slug]/apply/page.tsx');
assert(apply.includes('getRecruitmentOpeningState'), 'Apply route does not use canonical recruitment state resolver');
assert(apply.includes("redirect('/recruitment/closed')"), 'Ineligible recruitment opening does not route to CLOSED');
assert(!apply.includes('recruitment_jobs').replace(/\s/g, ''), 'Apply route unexpectedly contains direct recruitment persistence logic');

const closed = read('app/recruitment/closed/page.tsx');
assert(closed.includes("href=\"/recruitment\""), 'CLOSED state lacks recruitment recovery path');
assert(closed.includes("href=\"/roster\""), 'CLOSED state lacks roster recovery path');
assert(closed.includes('No other opening is selected automatically.'), 'CLOSED state does not communicate no automatic opening substitution');

const adminAuth = read('lib/admin-auth.ts');
assert(adminAuth.includes("redirect('/403')"), 'Admin persona boundary is missing non-admin denial');
assert(adminAuth.includes("redirect('/login?error=not_authenticated&next=%2Fadmin')"), 'Unauthenticated Admin access does not route to login');

const applicationAdmin = read('app/admin/recruitment/page.tsx');
assert(applicationAdmin.length > 0, 'Admin Inbox surface is empty');

const nonGoals = read('lib/product/contract.ts');
for (const phrase of [
  'player social network',
  'public applicant-status tracking system',
  'automated hiring/scouting decision engine',
  'chat, direct-message, or community platform',
  'payment, commerce, tournament-bracket, or full esports operations platform',
  'general-purpose CMS',
]) assert(nonGoals.includes(phrase), `V1 non-goal missing: ${phrase}`);

if (failures.length) {
  console.error('PRODUCT CONTRACT VERIFY: FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('PRODUCT CONTRACT VERIFY: PASS');
console.log('- SQUAD.25 product boundary: locked');
console.log('- Visitor / Applicant / Admin personas: locked');
console.log('- Funnel states and closed/deep-link rules: locked');
console.log('- Domain glossary and success metrics: locked');
console.log('- Phase 1 public/admin surfaces: present');
