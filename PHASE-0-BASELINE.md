# PHASE 0 — BASELINE REPORT

**Audit mode:** remediation + baseline capture  
**Application:** SQUAD.25 / squad25-rc-latest  
**Repository:** `11oikiyomasa/squad25-rc-latest`  
**Source branch:** `main`  
**Baseline commit:** `11b5f05c36589df3230173863e4b79550c60bc22`  
**Production Supabase project ref:** `wyjsosamlkbwksrslona`  
**Production Vercel project:** `squad25-rc-latest`  
**Audit date:** 2026-08-31

## 1. SOURCE OF TRUTH

**Decision: PASS**

- Repository: `11oikiyomasa/squad25-rc-latest`
- Production source branch: `main`
- Approved baseline SHA: `11b5f05c36589df3230173863e4b79550c60bc22`
- PR #25 is open and is **not** the source of truth; its head SHA differs from `main`.
- Database schema/security behavior is governed by `supabase/migrations/`.

## 2. CI/CD

**Decision: PASS**

CI run #460 for the baseline commit completed successfully.

Verified stages:

- source/agent contract verification
- AI reviewer validation
- typecheck
- production build
- production server start
- public route smoke tests

## 3. VERCEL PRODUCTION

**Decision: PASS**

Latest production deployment:

- Deployment: `dpl_JCYJtayuqxhLHJ2DVKc36hR42uQC`
- State: `READY`
- Target: `production`
- Git ref: `main`
- Git SHA: `11b5f05c36589df3230173863e4b79550c60bc22`

The production deployment SHA matches the approved `main` baseline SHA.

Primary aliases include:

- `squad25-rc-latest.vercel.app`
- `squad25-rc-latest-kontolgeming0909-9680.vercel.app`
- `squad25-rc-latest-git-main-kontolgeming0909-9680.vercel.app`

Runtime health endpoint returned HTTP 200 with database connectivity healthy.

## 4. SUPABASE PRODUCTION

**Decision: PASS for identity/state; backup evidence remains open.**

- Project ref: `wyjsosamlkbwksrslona`
- Region: `ap-northeast-1`
- Status: `ACTIVE_HEALTHY`
- PostgreSQL: 17.6.1.166

Current remote migration history ends at:

`20260830201946 phase7_close_direct_write_paths_reapply`

`20260830202148 phase0_security_and_performance_hardening`

The Phase 0 hardening migration was applied to production during this remediation.

## 5. RLS / PRIVILEGES

**Decision: PASS for reviewed public application boundary.**

All audited `public` tables have RLS enabled.

Recruitment application write access was previously too broad and has now been removed from `anon` and `authenticated` roles. Verified current privileges for the recruitment application boundary are read-only for authenticated admins, with mutations performed through controlled RPC/server paths.

Public recruitment job access remains read-only and limited to active, non-expired jobs.

The public submission RPC is server-only and executable only by `service_role`.

## 6. SECURITY FINDINGS / TECHNICAL DEBT

### Accepted as follow-up hardening (not unresolved public bypasses)

1. `admin_update_recruitment_application_v7` remains `SECURITY DEFINER` and executable by `authenticated`; the function performs an explicit admin authorization check. This remains a Supabase advisor warning and should be revisited as a hardening task.
2. Supabase Auth leaked-password protection is disabled. This is an account-security hardening item.
3. Supabase performance advisor reports several unused indexes. Do not remove them blindly; usage can change as production traffic grows.

These items are recorded as debt rather than hidden.

## 7. ENVIRONMENT / SECRETS

- `.env.example` contains configuration keys only and no secret values.
- No obvious hard-coded production secret was identified during repository review.
- Full Vercel Preview/Production key parity is **not independently evidenced by the available connector**.
- Secret values are intentionally excluded from this report.

**Status:** CONDITIONAL / evidence incomplete.

## 8. DATABASE BACKUP / RESTORE

**STATUS: NO-GO / EVIDENCE REQUIRED**

A valid Phase 0 exit requires evidence that production has a recoverable backup and that the recovery procedure has been tested.

The available project tooling in this audit does not expose the Supabase backup/restore operation or the production database password needed to create and restore a logical dump.

Required evidence before Phase 0 can be closed:

- backup timestamp or backup artifact identifier
- backup location / retention
- restore test target
- restore success result
- confirmation that critical database state is recoverable

A database backup must not be claimed merely because the production project is healthy.

## 9. PHASE 0 GATE

| Gate | Status |
|---|---|
| Source of Truth | PASS |
| Repository/CI baseline | PASS |
| Production DB identity | PASS |
| Production DB health | PASS |
| Migration state | PASS |
| Reviewed RLS boundary | PASS |
| Recruitment direct-write bypass | FIXED |
| Production deployment matches main | PASS |
| Runtime health | PASS |
| Known issues recorded | PASS |
| Environment parity evidence | CONDITIONAL |
| Production backup evidence | **FAIL / PENDING** |
| Restore test evidence | **FAIL / PENDING** |

## FINAL DECISION

**PHASE 0 EXIT = NO-GO**

The system baseline is technically reconciled for source control, production deployment, database identity, migration state, and the reviewed recruitment security boundary.

The phase remains frozen until production backup/restore evidence is captured. Environment parity should also be confirmed before the formal sign-off.

**No Phase 1 application implementation should be started from an unapproved production state.**
