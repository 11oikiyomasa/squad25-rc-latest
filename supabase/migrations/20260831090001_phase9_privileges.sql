begin;

-- Phase 9 privilege layer. RLS policy presence is not sufficient: the roles
-- must also have the underlying table privileges required for their policies.

-- Public read paths.
grant select on public.recruitment_cycles to anon, authenticated;
grant select on public.recruitment_jobs to anon, authenticated;
grant select on public.members to anon, authenticated;
grant select on public.montages to anon, authenticated;
grant select on public.achievements to anon, authenticated;
grant select on public.gallery_items to anon, authenticated;

-- Admin mutation/read paths remain constrained by RLS/private.is_admin().
grant select, insert, update, delete on public.recruitment_cycles to authenticated;
grant select, insert, update, delete on public.recruitment_jobs to authenticated;
grant select, insert, update, delete on public.members to authenticated;
grant select, insert, update, delete on public.montages to authenticated;
grant select, insert, update, delete on public.achievements to authenticated;
grant select, insert, update, delete on public.gallery_items to authenticated;

grant select on public.recruitment_applications to authenticated;
grant select, insert on public.recruitment_application_notes to authenticated;
grant select on public.audit_logs to authenticated;

-- Direct Applicant writes/reads remain closed by privileges and RLS.
revoke select, insert, update, delete on public.recruitment_applications from anon;
revoke insert, update, delete on public.recruitment_applications from authenticated;
revoke select, insert, update, delete on public.recruitment_application_notes from anon;

commit;
