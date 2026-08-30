# SQUAD.25 database migration policy

`supabase/migrations/` is the canonical source of truth for database schema and database-owned security behavior.

## Reconciled history

The connected production project had older migration entries that were not all present in Git. The repository now uses a reconciled baseline at `20260827185426_create_squad_content.sql` that captures the complete core schema, RLS, storage setup, publish authorization, and starter content needed for a clean bootstrap.

Migration markers for the historical versions that were already applied in production are retained as explicit files. These marker files are intentionally no-op because their resulting state is already represented by the reconciled baseline. This avoids inventing a second, divergent historical schema while keeping the migration version timeline explicit.

The publish migration at `20260828201517_atomic_admin_publish.sql` contains the production-final `SECURITY INVOKER` implementation and its restricted execute grant. The later production hardening/revoke versions remain as markers because their final state is already consolidated there.

Recruitment and scrims use the migration versions recorded by the connected production database:

- `20260829122711_add_player_recruitment_applications.sql`
- `20260829132004_add_scrims.sql`

## Fresh project

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

This applies the canonical migration set in timestamp order.

## Local validation

For schema changes, create the migration with the Supabase CLI, then reset the local database before committing it:

```bash
supabase migration new <change_description>
supabase db reset
npm run verify
```

Do not edit the remote schema directly as the normal development workflow. Supabase tracks applied migration versions separately from Git; direct remote schema changes create drift that must be explicitly reconciled. The supported recovery path is to inspect `supabase migration list` and use `supabase db pull` or `supabase migration repair` as appropriate.

`SUPABASE_SCHEMA.sql` and `SUPABASE_SEED.sql` remain compatibility snapshots for manual inspection or recovery. Do not maintain new schema changes in those files instead of adding a migration.
