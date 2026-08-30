-- Public and authenticated clients must use the hardened RPCs. This prevents
-- bypassing validation, rate limiting, resume checks, or audit logging via PostgREST.
revoke insert, update, delete on public.recruitment_applications from anon, authenticated;
revoke insert, update, delete on public.recruitment_application_notes from anon, authenticated;
grant select on public.recruitment_applications to authenticated;

-- Keep admin reads through RLS; processing mutations are RPC-only.
drop policy if exists "Admins can update recruitment applications" on public.recruitment_applications;
