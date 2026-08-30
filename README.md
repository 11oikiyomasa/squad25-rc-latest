# SQUAD.25 — MLBB Squad Website

A dark, editorial-style MLBB squad roster and montage archive built with Next.js + TypeScript + Tailwind CSS, backed by Supabase Auth, Postgres, and Storage.

## Included

- 25-player roster data model
- Search + role filters
- Member profile modal
- Shareable member pages at `/member/[id]`
- Multiple montage slots per player (YouTube ID or URL)
- Featured montage section
- Achievement/history section
- Squad photo archive
- Responsive mobile-first layout
- Not-found and error states
- Supabase production schema + RLS + public media bucket
- Local/Cloud Content Studio at `/admin` with member/montage editing, JSON import/export, protected publishing, and member photo upload
- Supabase email/password login at `/login` with protected `/admin` and admin allowlist
- Public content API with seed-data fallback when Supabase is not configured
- Recruitment application flow at `/recruitment` with private admin management
- Public scrim schedule at `/scrims` with private internal notes
- SSR-safe admin hydration guard (browser storage is only read after mount)
- Environment template (`.env.example`)

## Run locally

Requirements: Node.js 20.9+.

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Content setup

Edit `data/squad.ts` for the temporary local content model. Replace the placeholder member SVGs in `public/images/members/` and add real YouTube IDs to each `youtubeId` field before launch.

### Database setup

`supabase/migrations/` is the **canonical database source of truth**. Do not provision a new environment by running `SUPABASE_SCHEMA.sql` and `SUPABASE_SEED.sql` as the primary workflow.

For a fresh Supabase project:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

The migration baseline contains the reconciled core schema and starter content. Later migrations add atomic admin publishing, recruitment applications, and scrims. The historical migration markers are retained so the repository's migration timeline stays aligned with the connected production project.

`SUPABASE_SCHEMA.sql` and `SUPABASE_SEED.sql` are retained as **manual compatibility snapshots only**. They are not the canonical migration source and must not become a second schema-maintenance path.

Create an Auth user and add its UUID to `public.admin_users` when setting up an administrator. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`/Vercel. Never expose a service-role/secret key in `NEXT_PUBLIC_*`. See `ADMIN_PRODUCTION.md`.

For day-to-day schema changes, create a new migration under `supabase/migrations/`, test it with `supabase db reset`, then deploy with `supabase db push`. Supabase tracks applied migration versions separately from Git, so changing the remote schema outside migrations can cause migration-history drift. See `supabase/MIGRATIONS.md` for the repository-specific policy.

## Verification

The repository has a permanent GitHub Actions release check. Every push and pull request to `main` runs:

```bash
npm ci
npm run verify
npm run typecheck
npm run build
npm start
```

The verification suite checks product structure, TypeScript syntax, auth/API routes, the canonical Supabase migration set, and key security invariants. CI also smoke-tests `/`, `/member/ryuu`, `/login`, and `/api/health` against the built production server.

The latest clean-run verification passed with:

- 25/25 members
- 25/25 unique nicknames
- 25/25 member assets
- 6 gallery assets
- 28 TS/TSX files parsed
- Auth/API/schema and route/config checks present
- TypeScript typecheck passed
- Next.js production build passed
- Production server boot passed
- Route smoke tests passed
- npm audit reported 0 vulnerabilities

### Health check

After configuring Supabase, `GET /api/health` verifies the database connection, the 25-member roster, and montage availability.

## Release verification

Production-readiness is verified in CI against the GitHub `main` branch. Vercel should be connected to this repository with `main` as the production branch so every validated push can produce a production deployment.

Vercel Git auto-deployment is explicitly enabled in `vercel.json`.
