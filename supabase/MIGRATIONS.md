# SQUAD.25 database migration policy

`supabase/migrations/` is the canonical source of truth for database schema and database-owned security behavior.

## Current production reconciliation

The connected production project is `wyjsosamlkbwksrslona` in `ap-northeast-1`. Its migration history is older in places than the current repository migration filenames because earlier work reconciled production state through several idempotent migrations. Do not assume a filename match alone proves schema equivalence.

As of the Phase 0 remediation audit, production contains the Phase 7 recruitment schema and the following security state has been verified directly:

- `public.recruitment_applications` has no INSERT/UPDATE/DELETE privilege for `anon` or `authenticated`.
- `public.recruitment_application_notes` has no INSERT/UPDATE/DELETE privilege for `anon` or `authenticated`.
- `submit_recruitment_application_v7(jsonb,text)` is executable only by `service_role`.
- Recruitment resumes are stored in a private storage bucket with PDF-only and 5 MiB limits.
- Public recruitment-job reads are limited to active, non-expired jobs for `anon`.
- RLS remains enabled on the application, notes, jobs, audit, roster, media, and match tables.

The Phase 0 security/performance remediation applied to production is recorded in Git as:

- `20260830202148_phase0_security_and_performance_hardening.sql`

Production also contains earlier equivalent Phase 7 migration entries with different timestamps (`20260830193914`, `20260830193924`, `20260830193934`, `20260830193939`, `20260830195557`, `20260830201946`). These are part of the reconciled remote history and must not be blindly duplicated or reverted.

The current repository also contains later Phase 7 migration files under `2026083102xxxx`. Their final state was compared against the live schema during the baseline audit. Before any future `supabase db push`, reconcile migration history deliberately and use migration repair only after proving that the target schema already matches the intended migration state.

## Fresh project

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

This applies the canonical migration set in timestamp order.

## Existing environments

Before deploying this repository to an existing environment:

```bash
supabase migration list
```

Compare local and remote versions and then compare the actual schema. If an environment contains repository-only historical versions or remote-only versions from an earlier reconciliation, stop and investigate. Do not blindly re-apply or revert migrations against live data.

Use `supabase migration repair` only when the database state is already correct and only the migration tracking record needs reconciliation. Repair changes migration history; it does not execute SQL.

## Security boundary

Public recruitment submissions are intentionally server-mediated:

```text
Browser
  -> Next.js /api/recruitment
  -> Turnstile + payload/PDF validation + rate limiting
  -> private resume upload
  -> service_role submission RPC
  -> database
```

Do not restore direct PostgREST INSERT access to `recruitment_applications` or `recruitment_application_notes` as a workaround.

`SUPABASE_SCHEMA.sql` and `SUPABASE_SEED.sql` remain compatibility snapshots for manual inspection or recovery. They are not the canonical migration source.
