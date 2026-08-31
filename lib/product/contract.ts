import { FUNNEL_STATES, FUNNEL_TRANSITIONS, type FunnelState } from '@/lib/funnel/state';

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

export { FUNNEL_STATES, FUNNEL_TRANSITIONS };
export type { FunnelState };

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

export const PHASE1_SURFACES = {
  PUBLIC: {
    HOME: 'SURFACE_HOME',
    ROSTER: 'SURFACE_ROSTER',
    MEMBER_PAGE: 'SURFACE_MEMBER_PAGE',
    RECRUITMENT: 'SURFACE_RECRUITMENT',
    RECRUITMENT_CLOSED: 'SURFACE_RECRUITMENT_CLOSED',
    RECRUITMENT_SUCCESS: 'SURFACE_RECRUITMENT_SUCCESS',
    RECRUITMENT_ERROR: 'SURFACE_RECRUITMENT_ERROR',
    PUBLIC_NOT_FOUND: 'SURFACE_PUBLIC_NOT_FOUND',
    SCRIMS: 'SURFACE_SCRIMS',
    MATCHES: 'SURFACE_MATCHES',
    MEDIA: 'SURFACE_MEDIA',
  },
  ADMIN: {
    LOGIN: 'SURFACE_ADMIN_LOGIN',
    INBOX: 'SURFACE_ADMIN_INBOX',
    RECRUITMENT: 'SURFACE_ADMIN_RECRUITMENT',
    ROSTER: 'SURFACE_ADMIN_ROSTER',
    MEDIA: 'SURFACE_ADMIN_MEDIA',
    MATCHES: 'SURFACE_ADMIN_MATCHES',
    SCRIMS: 'SURFACE_ADMIN_SCRIMS',
    PREVIEW: 'SURFACE_ADMIN_PREVIEW',
  },
} as const;

export const REQUIRED_DOMAIN_ENTITIES = [
  'DOMAIN_MEMBER',
  'DOMAIN_ROSTER',
  'DOMAIN_RECRUITMENT_CYCLE',
  'DOMAIN_RECRUITMENT_OPENING',
  'DOMAIN_APPLICATION',
  'DOMAIN_APPLICATION_STATUS',
  'DOMAIN_APPLICATION_NOTE',
  'DOMAIN_ADMIN',
] as const;

export const PHASE1_RULES = {
  MEMBER_IS_PUBLIC: true,
  MEMBER_DEEP_LINK_WHEN_RECRUITMENT_CLOSED: FUNNEL_STATES.MEMBER_PAGE,
  RECRUITMENT_CLOSED_STATE: FUNNEL_STATES.RECRUITMENT_CLOSED,
  ADMIN_INBOX_PERSONA: PERSONAS.ADMIN,
  APPLICANT_REQUIRES_PERSISTENT_ACCOUNT: false,
} as const;
