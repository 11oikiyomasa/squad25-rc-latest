# Production admin setup

1. Create a Supabase project.
2. Run the repository migrations in `supabase/migrations/` in order. The Phase 7 migrations create the active recruitment jobs, private resume bucket, application notes, audit log, hardened public submission RPC, and admin-only processing RPC.
3. Enable Email + Password in Supabase Auth.
4. Create one admin user in Auth.
5. Copy that user's UUID into `public.admin_users`:

```sql
insert into public.admin_users (user_id) values ('AUTH_USER_UUID');
```

6. Set these environment variables in Vercel/local `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
NEXT_PUBLIC_TURNSTILE_SITE_KEY=YOUR_TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY=YOUR_TURNSTILE_SECRET_KEY
RESEND_API_KEY=YOUR_RESEND_API_KEY
RECRUITMENT_FROM_EMAIL=Recruitment <recruitment@YOUR_DOMAIN>
```

`SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`, and `RESEND_API_KEY` must never use a `NEXT_PUBLIC_` prefix and must never be exposed to the browser.

7. Deploy with the environment variables and open `/login`.
8. Sign in. `/admin` is blocked unless the authenticated user exists in `admin_users`.

## Phase 7 security model

- Public recruitment submissions are multipart/form-data and require an active `recruitment_jobs` row.
- Resume files are limited to 5 MiB, must be named `.pdf`, declare `application/pdf`, and contain the `%PDF-` magic bytes. Resumes are stored in the private `recruitment-resumes` bucket and exposed to admins only through short-lived signed URLs.
- Text fields are bounded and normalized server-side. React output is escaped by default; database writes use parameterized Supabase APIs/RPCs.
- The public submission path is rate-limited to 3 accepted attempts per IP per hour at the database layer. The email + job combination has a unique database index, so concurrent duplicate requests cannot both succeed.
- Cloudflare Turnstile is verified server-side. A hidden honeypot field rejects automated submissions without revealing the rejection to the bot.
- Admin processing uses RBAC (`admin_users`) and a database transaction function. Valid status transitions are `NEW → REVIEWING → SHORTLISTED → ACCEPTED` or `REJECTED`; rejected applications cannot be silently reopened.
- Status changes and appended internal notes are written atomically with an `audit_logs` row containing actor, timestamp, entity, old/new status, and IP.
- Direct client INSERT/UPDATE/DELETE access to applications and notes is revoked. Clients must use the hardened RPCs.
- Admin lists use server-side pagination, search, status filtering, and date filtering; responses are `no-store`.

## Existing platform security

- Authorization is enforced by both the Next.js server/proxy layer and Supabase RLS.
- Public tables are read-only to visitors; writes require private authorization helpers or the specific public submission RPC.
- The existing `squad-media` bucket remains public for image playback; recruitment resumes are deliberately separate and private.
