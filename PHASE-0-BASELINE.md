# PHASE 0 — BASELINE REPORT

**Audit mode:** final baseline reconciliation  
**Application:** SQUAD.25 / squad25-rc-latest  
**Repository:** `11oikiyomasa/squad25-rc-latest`  
**Source branch:** `main`  
**Frozen application baseline:** `11b5f05c36589df3230173863e4b79550c60bc22`  
**Production Supabase project ref:** `wyjsosamlkbwksrslona`  
**Supabase organization plan:** Free  
**Production Vercel project:** `squad25-rc-latest`  
**Audit date:** 2026-08-31

## 1. SOURCE OF TRUTH

**Decision: PASS**

- Repository: `11oikiyomasa/squad25-rc-latest`
- Production source branch: `main`
- Frozen application baseline SHA: `11b5f05c36589df3230173863e4b79550c60bc22`
- Commits after the frozen application baseline during Phase 0 are documentation/evidence-only and are not treated as application behavior changes.
- PR #25 is open and is **not** the source of truth; its head SHA differs from `main`.
- Database schema and database-owned security behavior are governed by `supabase/migrations/`.

## 2. CI/CD

**Decision: PASS**

CI run #460 for the frozen application baseline completed successfully.

Verified stages:

- source/agent contract verification
- AI reviewer validation
- typecheck
- production build
- production server start
- public route smoke tests

The CI result establishes a known-good application baseline before Phase 1 implementation.

## 3. VERCEL PRODUCTION

**Decision: PASS**

Verified production deployment for the frozen application baseline:

- Deployment: `dpl_JCYJtayuqxhLHJ2DVKc36hR42uQC`
- State: `READY`
- Target: `production`
- Git ref: `main`
- Git SHA: `11b5f05c36589df3230173863e4b79550c60bc22`

The production app code matches the frozen application baseline. Later `main` commits are documentation/evidence-only.

Primary aliases currently associated with the project:

- `squad25-rc-latest.vercel.app`
- `squad25-rc-latest-kontolgeming0909-9680.vercel.app`
- `squad25-rc-latest-git-main-kontolgeming0909-9680.vercel.app`

The retired `andregsman.eu.org` domain is not part of the current Vercel domain set.

Runtime `/api/health` returned HTTP 200 with healthy Supabase connectivity.

## 4. SUPABASE PRODUCTION

**Decision: PASS**

- Project ref: `wyjsosamlkbwksrslona`
- Region: `ap-northeast-1`
- Status: `ACTIVE_HEALTHY`
- PostgreSQL: `17.6.1.166`
- Organization plan: Free

Production migration history is reconciled through the Phase 0 security/performance hardening migration.

The Phase 0 hardening migration was applied to production. The previously identified direct recruitment application write path for `anon`/`authenticated` was removed.

## 5. RLS / PRIVILEGES

**Decision: PASS for reviewed application/public data boundaries**

All audited `public` tables have RLS enabled.

Recruitment application writes are not available to `anon` or `authenticated`; authenticated admins have read access and controlled processing uses server/RPC paths.

Public recruitment jobs remain read-only and constrained to active, non-expired records.

The public recruitment submission RPC is service-role-only.

## 6. SECURITY FINDINGS / TECHNICAL DEBT

These items are recorded as follow-up hardening and do not block the Phase 0 exit under the agreed gate.

1. `admin_update_recruitment_application_v7` remains `SECURITY DEFINER` and executable by `authenticated`, but explicitly requires an authenticated role and `private.is_admin()` before mutating application state.
2. Supabase Auth leaked-password protection is disabled. Track as account-security hardening.
3. Supabase performance advisor reports unused indexes. Do not remove them blindly; reassess after real production traffic exists.
4. A historical Vercel runtime error (`JWT issued at future`) was observed on an older deployment. The current approved baseline deployment is healthy; retain the historical event for observation.

No known unresolved anonymous recruitment-write bypass remains in the reviewed boundary.

## 7. ENVIRONMENT / SECRETS

- `.env.example` contains configuration keys only and no secret values.
- No obvious hard-coded production secret was identified during repository review.
- Full Vercel Preview/Production environment-key parity is not independently evidenced by the available connector.
- Secret values are intentionally excluded from this report.

**Decision: ACCEPTED LIMITATION / NON-BLOCKING**

The missing remote key-parity evidence is documented and does not block this Phase 0 exit because the agreed Phase 0 gate requires source-of-truth, production DB identification/state, deployment target, and known-issue accounting—not a secret-value comparison.

## 8. DATABASE BACKUP / RESTORE

**STATUS: OUT OF SCOPE FOR PHASE 0 GATE**

Per the project decision recorded during this audit, backup creation and restore testing are explicitly excluded from the Phase 0 exit criteria.

This does **not** claim that backups exist or that restore has been tested. It only records that backup/restore is an operational concern outside the current Phase 0 gate.

## 9. FINAL PHASE 0 GATE

| Gate | Status |
|---|---|
| Source of Truth | PASS |
| Frozen application baseline | PASS |
| Repository/CI baseline | PASS |
| Production DB identity | PASS |
| Production DB health | PASS |
| Migration state | PASS |
| Reviewed RLS boundary | PASS |
| Recruitment direct-write bypass | FIXED |
| Production app matches frozen baseline | PASS |
| Runtime health | PASS |
| Known issues recorded | PASS |
| Security follow-ups recorded | PASS |
| Environment parity limitation recorded | PASS / NON-BLOCKING |
| Backup / restore | OUT OF SCOPE |

## FINAL DECISION

# PHASE 0 EXIT = GO

The required Phase 0 gate is satisfied under the project's explicitly agreed scope.

The approved application baseline is `11b5f05c36589df3230173863e4b79550c60bc22`. Production Vercel is verified against that baseline, the production Supabase project is identified and healthy, the reviewed public data/security boundaries are reconciled, and known technical/security debt is documented.

Backup/restore is intentionally excluded from this gate. Environment-key parity is documented as an evidence limitation rather than being represented as a false PASS.

**Phase 1/2 implementation may proceed from this approved baseline.**
