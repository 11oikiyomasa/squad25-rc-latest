# PHASE 0 — BASELINE REPORT

**Audit mode:** remediation + baseline capture  
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
- Commits added after this SHA during Phase 0 remediation are documentation/evidence-only and must not be treated as application behavior changes.
- PR #25 is open and is **not** the source of truth; its head SHA differs from `main`.
- Database schema/security behavior is governed by `supabase/migrations/`.

## 2. CI/CD

**Decision: PASS for frozen application baseline**

CI run #460 for the frozen application baseline completed successfully.

Verified stages:

- source/agent contract verification
- AI reviewer validation
- typecheck
- production build
- production server start
- public route smoke tests

Subsequent Phase 0 commits only record evidence and baseline documentation.

## 3. VERCEL PRODUCTION

**Decision: PASS for frozen application baseline**

Verified production deployment for the frozen application baseline:

- Deployment: `dpl_JCYJtayuqxhLHJ2DVKc36hR42uQC`
- State: `READY`
- Target: `production`
- Git ref: `main`
- Git SHA: `11b5f05c36589df3230173863e4b79550c60bc22`

The production app code matches the frozen application baseline. Later commits in `main` were documentation/evidence-only.

Primary aliases include:

- `squad25-rc-latest.vercel.app`
- `squad25-rc-latest-kontolgeming0909-9680.vercel.app`
- `squad25-rc-latest-git-main-kontolgeming0909-9680.vercel.app`

Runtime health returned HTTP 200 and database connectivity was healthy.

## 4. SUPABASE PRODUCTION

**Decision: PASS for identity/state; backup evidence remains open.**

- Project ref: `wyjsosamlkbwksrslona`
- Region: `ap-northeast-1`
- Status: `ACTIVE_HEALTHY`
- PostgreSQL: 17.6.1.166
- Organization plan: Free

Production migration history is reconciled through the Phase 0 security/performance hardening migration.

The Phase 0 hardening migration was applied to production and direct recruitment application writes from `anon`/`authenticated` were removed.

## 5. RLS / PRIVILEGES

**Decision: PASS for reviewed application/public data boundaries**

All audited `public` tables have RLS enabled.

Recruitment application writes are no longer available to `anon` or `authenticated`; authenticated admins retain read access and controlled processing occurs through server/RPC paths.

Public recruitment jobs remain read-only and constrained to active/non-expired records.

The public recruitment submission RPC is service-role-only.

## 6. SECURITY FINDINGS / TECHNICAL DEBT

### Accepted follow-up hardening

1. `admin_update_recruitment_application_v7` remains `SECURITY DEFINER` and executable by `authenticated`, but the function explicitly requires `auth.role() = 'authenticated'` and `private.is_admin()`. This remains a Supabase advisor warning and is a hardening follow-up, not an unresolved anonymous bypass.
2. Supabase Auth leaked-password protection is disabled. Record as account-security hardening.
3. Supabase performance advisor reports unused indexes. Do not remove them blindly; reassess with real production query traffic.
4. A historical Vercel runtime error (`JWT issued at future`) was observed on an older deployment, not the current approved baseline deployment. Retain for observation rather than treating it as a current production outage.

These findings are recorded and not hidden.

## 7. ENVIRONMENT / SECRETS

- `.env.example` contains configuration keys only and no secret values.
- No obvious hard-coded production secret was identified during repository review.
- Full Vercel Preview/Production key parity is **not independently evidenced by the available connector**.
- Secret values are intentionally excluded from this report.

**Status:** CONDITIONAL / evidence incomplete.

## 8. DATABASE BACKUP / RESTORE

**STATUS: NO-GO / EVIDENCE REQUIRED**

The production Supabase organization is on the Free plan. Supabase documentation states automatic daily backups are available for Pro, Team, and Enterprise plans; Free projects should use regular `supabase db dump` logical backups and keep them off-site. citeturn469739search4

The available connected tooling does not provide the production database password or a backup/restore operation, so a real backup artifact and restore test cannot honestly be claimed from this audit session.

Required evidence before Phase 0 can close:

- logical backup created with `supabase db dump` (or equivalent verified production backup)
- backup stored outside the production project
- backup timestamp and checksum/artifact ID recorded
- restore performed to a safe non-production target
- restored schema/data sanity checked
- restore result recorded

Recommended logical-backup sequence (operator with database credentials):

```bash
supabase link --project-ref wyjsosamlkbwksrslona
supabase db dump --linked -f phase0-schema.sql
supabase db dump --linked --data-only --use-copy -f phase0-data.sql
```

For a migration-grade backup/restore exercise, preserve roles separately as recommended by the Supabase CLI documentation. citeturn469739search0turn469739search2

## 9. PHASE 0 GATE

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
| Environment parity evidence | CONDITIONAL |
| Production backup evidence | **FAIL / PENDING** |
| Restore test evidence | **FAIL / PENDING** |

## FINAL DECISION

**PHASE 0 EXIT = NO-GO**

The technical baseline is reconciled for source control, CI, production deployment, database identity, migration state, and the reviewed public data boundaries.

The remaining hard gate is recoverability: this Free-plan production database needs an actual logical backup plus a successful restore test before the system can be declared ready to leave Phase 0.

**Do not begin Phase 1 implementation from an unapproved production baseline.**
