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
- Supabase production schema + RLS + public media bucket (`SUPABASE_SCHEMA.sql`) aligned with the connected project
- Local/Cloud Content Studio at `/admin` with member/montage editing, JSON import/export, protected publishing, and member photo upload
- Supabase email/password login at `/login` with protected `/admin` and admin allowlist
- Public content API with seed-data fallback when Supabase is not configured
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

For a fresh production database, run `SUPABASE_SCHEMA.sql` and then `SUPABASE_SEED.sql`. Then create an Auth user and add its UUID to `public.admin_users`. The connected project used for this build is already seeded. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`/Vercel. See `ADMIN_PRODUCTION.md`. Never expose a service-role/secret key in `NEXT_PUBLIC_*`.

## Verification

The project includes an offline structural check:

```bash
npm run verify
```

In this workspace, `npm run verify` passes for the 25-member seed, unique nicknames, required member assets, gallery assets, routes, config, and TypeScript syntax. A full `next build` is not claimed here because dependency installation from the npm registry timed out in this environment.


### Health check

After configuring Supabase, `GET /api/health` verifies the database connection, the 25-member roster, and montage availability.

## Release verification

The release candidate has passed static/source verification. The connected Supabase project has been checked for roster/data integrity and security policy posture. Full local `next build` could not be run in the sandbox because npm registry access timed out; deployment-side builds remain the authoritative production build check.
