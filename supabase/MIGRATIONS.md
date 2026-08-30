# SQUAD.25 database migration policy

`supabase/migrations/` is the canonical source of truth for database schema and database-owned security behavior.

## Reconciled history

The connected production project had older migration entries that were not all present in Git. The repository now uses a reconciled baseline at `20260827185426_create_squad_content.sql` that captures the complete core schema, RLS, storage setup, publish authorization, and starter content needed for a clean bootstrap.

Migration markers for the historical versions that were already applied in production are retained as explicit files. These marker files are intentionally no-op because their resulting state is already represented by the reconciled baseline. This avoids inventing a second, divergent historical schema while keeping the migration version timeline explicit.

The publish migration at `20260828201517_atomic_admin_publish.sql` contains the production-final `SECURITY INVOKER` implementation and its restricted execute grant. The later production hardening/revoke versions remain as markers because their final state is already consolidated there.

Recruitment and scrims use the migration versions recorded by the connected production database:

- `20260829122711_add_player_recruitment_applications.sql`
- `20260829132004_add_scrims.sql`

The connected production project was re-checked during this reconciliation and currently reports these same 17 migration versions. Because the versions already exist remotely, merging this repository change does not require mutating production migration history. Do not run `migration repair` merely because a file was renamed or consolidated; first compare local and remote versions with `supabase migration list`. Supabase documents migration history comparison by migration timestamp/version, and `migration repair` changes the tracking table only.

## Fresh project

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

This applies the canonical migration set in timestamp order.

## Existing environments

Before deploying this repository to an environment other than the connected production project:

```bash
supabase migration list
```

The local migration versions must match the remote migration history before `supabase db push`. If an environment contains repository-only historical versions from an older unreconciled checkout, stop and reconcile that environment deliberately; do not blindly revert or re-apply migrations against live data.

Use `supabase migration repair` only when the database state is already correct and only the migration tracking record is wrong. Repair changes migration history; it does not run SQL.

## Local validation

For schema changes, create the migration with the Supabase CLI, then reset the local database before committing it:

```bash
supabase migration new <change_description>
supabase db reset
npm run verify
```

Do not edit the remote schema directly as the normal development workflow. Supabase tracks applied migration versions separately from Git; direct remote schema changes create drift that must be explicitly reconciled. The supported recovery path is to inspect `supabase migration list` and use `supabase db pull` or `supabase migration repair` as appropriate.

`SUPABASE_SCHEMA.sql` and `SUPABASE_SEED.sql` remain compatibility snapshots for manual inspection or recovery. Do not maintain new schema changes in those files instead of adding a migration.
