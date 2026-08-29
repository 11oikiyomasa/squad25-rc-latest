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

The repository has a permanent GitHub Actions release check. Every push and pull request to `main` runs:

```bash
npm ci
npm run verify
npm run typecheck
npm run build
npm start
```

The CI also smoke-tests `/`, `/member/ryuu`, `/login`, and `/api/health` against the built production server.

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
