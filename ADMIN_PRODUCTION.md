# Production admin setup

1. Create a Supabase project.
2. Run `SUPABASE_SCHEMA.sql` in the Supabase SQL editor. For a fresh project, run `SUPABASE_SEED.sql` immediately after it.
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
```

7. Deploy with the environment variables and open `/login`.
8. Sign in. `/admin` is blocked unless the authenticated user exists in `admin_users`.

## Security notes

- Never put a Supabase service-role/secret key in `NEXT_PUBLIC_*` variables.
- Authorization is enforced by both the Next.js server/proxy layer and Supabase RLS.
- Public tables are read-only to visitors; writes require the private `is_admin()` authorization helper. The helper is not exposed through the public API schema.
- The `squad-media` bucket is public for image playback, capped at 10 MB per file and restricted to JPG/PNG/WEBP. Uploads/updates/deletes require an admin. Montage videos remain external YouTube links so the site does not bloat its storage.

## Connected project status

The current connected Supabase project already contains the production content model, 25 roster rows, 50 montage placeholders, 3 achievements, 6 gallery items, and the `squad-media` bucket. Before using `/login`, create an Auth user and add that UUID to `public.admin_users`.
