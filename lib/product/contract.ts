export const PRODUCT_ID = 'SQUAD.25' as const;

export const PRODUCT_ONE_LINER =
  'SQUAD.25 is a dark esports roster experience that turns public member discovery into a secure, admin-reviewed recruitment funnel.' as const;

export const V1_NON_GOALS = [
  'A player social network or applicant account portal.',
  'A public applicant-status tracking system.',
  'An automated hiring/scouting decision engine.',
  'A chat, direct-message, or community platform.',
  'A payment, commerce, tournament-bracket, or full esports operations platform.',
  'A general-purpose CMS beyond the content needed to operate the roster and recruitment funnel.',
] as const;

export const PERSONAS = {
  VISITOR: 'VISITOR',
  APPLICANT: 'APPLICANT',
  ADMIN: 'ADMIN',
} as const;

export type PersonaId = (typeof PERSONAS)[keyof typeof PERSONAS];

export const FUNNEL_STATES = {
  VISITOR: 'FUNNEL_VISITOR',
  DEEP_LINK_MEMBER_ENTRY: 'FUNNEL_DEEP_LINK_MEMBER_ENTRY',
  MEMBER_PAGE: 'FUNNEL_MEMBER_PAGE',
  JOIN_CTA: 'FUNNEL_JOIN_CTA',
  DEEP_LINK_RECRUITMENT_ENTRY: 'FUNNEL_RECRUITMENT_DEEP_LINK_ENTRY',
  RECRUITMENT_FORM: 'FUNNEL_RECRUITMENT_FORM',
  RECRUITMENT_CLOSED: 'FUNNEL_RECRUITMENT_CLOSED',
  SUBMISSION_ERROR: 'FUNNEL_SUBMISSION_ERROR',
  SUBMISSION_SUCCESS: 'FUNNEL_SUBMISSION_SUCCESS',
  ADMIN_INBOX: 'FUNNEL_ADMIN_INBOX',
  MEMBER_NOT_FOUND: 'FUNNEL_MEMBER_NOT_FOUND',
} as const;

export type FunnelState = (typeof FUNNEL_STATES)[keyof typeof FUNNEL_STATES];

export const FUNNEL_TRANSITIONS = [
  ['FUNNEL_VISITOR', 'selects a public member', 'FUNNEL_MEMBER_PAGE'],
  ['FUNNEL_VISITOR', 'opens /member/[id] directly', 'FUNNEL_DEEP_LINK_MEMBER_ENTRY'],
  ['FUNNEL_DEEP_LINK_MEMBER_ENTRY', 'member exists and is public', 'FUNNEL_MEMBER_PAGE'],
  ['FUNNEL_DEEP_LINK_MEMBER_ENTRY', 'member does not exist or is unavailable', 'FUNNEL_MEMBER_NOT_FOUND'],
  ['FUNNEL_MEMBER_PAGE', 'Join CTA selected while recruitment is OPEN', 'FUNNEL_JOIN_CTA'],
  ['FUNNEL_JOIN_CTA', 'recruitment route opened', 'FUNNEL_RECRUITMENT_FORM'],
  ['FUNNEL_VISITOR', 'opens recruitment route directly', 'FUNNEL_DEEP_LINK_RECRUITMENT_ENTRY'],
  ['FUNNEL_DEEP_LINK_RECRUITMENT_ENTRY', 'recruitment cycle is OPEN', 'FUNNEL_RECRUITMENT_FORM'],
  ['FUNNEL_DEEP_LINK_RECRUITMENT_ENTRY', 'recruitment cycle is CLOSED', 'FUNNEL_RECRUITMENT_CLOSED'],
  ['FUNNEL_RECRUITMENT_FORM', 'authoritative submission succeeds', 'FUNNEL_SUBMISSION_SUCCESS'],
  ['FUNNEL_RECRUITMENT_FORM', 'authoritative submission fails', 'FUNNEL_SUBMISSION_ERROR'],
  ['FUNNEL_SUBMISSION_ERROR', 'applicant retries with accepted input', 'FUNNEL_RECRUITMENT_FORM'],
  ['FUNNEL_SUBMISSION_SUCCESS', 'persisted Application becomes available to authorized administration', 'FUNNEL_ADMIN_INBOX'],
  ['FUNNEL_RECRUITMENT_CLOSED', 'a new/open recruitment cycle becomes available', 'FUNNEL_RECRUITMENT_FORM'],
] as const satisfies ReadonlyArray<readonly [FunnelState, string, FunnelState]>;

export const DOMAIN_GLOSSARY = {
  DOMAIN_MEMBER: 'A publicly visible squad player identity represented by a Member Page.',
  DOMAIN_ROSTER: 'The authoritative public collection of Members.',
  DOMAIN_APPLICANT: 'A person who starts or submits a recruitment Application.',
  DOMAIN_RECRUITMENT_CYCLE: 'A bounded period during which recruitment submissions are accepted.',
  DOMAIN_RECRUITMENT_OPENING: 'A specific recruitment target or role offered within a Recruitment Cycle.',
  DOMAIN_APPLICATION: 'The submitted recruitment record belonging to one Applicant for one eligible Recruitment Opening.',
  DOMAIN_APPLICATION_STATUS: 'The lifecycle status assigned to an Application after submission.',
  DOMAIN_APPLICATION_NOTE: 'A private administrative note attached to an Application.',
  DOMAIN_ADMIN: 'An authenticated user authorized to access private administration.',
  DOMAIN_ADMIN_INBOX: 'The private operational surface where ADMIN users inspect and process Applications.',
  DOMAIN_SUBMISSION: 'The authoritative act of attempting to create an Application through the recruitment boundary.',
} as const;

export const V1_SUCCESS_METRICS = {
  METRIC_01_MEMBER_TO_JOIN_CONVERSION: '>= 20% of eligible Member Page sessions activate the Join CTA.',
  METRIC_02_RECRUITMENT_COMPLETION_RATE: '>= 60% of Recruitment Form starts result in a successful Application submission.',
  METRIC_03_VALID_SUBMISSION_SUCCESS_RATE: '>= 97% of valid submission attempts reach FUNNEL_SUBMISSION_SUCCESS.',
  METRIC_04_INBOX_AVAILABILITY_LATENCY: '>= 99% of successful Applications become visible in FUNNEL_ADMIN_INBOX within 60 seconds.',
  METRIC_05_SECURITY_BOUNDARY_INTEGRITY: '0 unauthorized Application/Admin Inbox reads or writes in automated release/security verification.',
} as const;

export const PHASE1_RULES = {
  MEMBER_IS_PUBLIC: true,
  MEMBER_DEEP_LINK_WHEN_RECRUITMENT_CLOSED: 'FUNNEL_MEMBER_PAGE' as const,
  RECRUITMENT_CLOSED_STATE: 'FUNNEL_RECRUITMENT_CLOSED' as const,
  ADMIN_INBOX_PERSONA: PERSONAS.ADMIN,
  APPLICANT_REQUIRES_PERSISTENT_ACCOUNT: false,
} as const;
