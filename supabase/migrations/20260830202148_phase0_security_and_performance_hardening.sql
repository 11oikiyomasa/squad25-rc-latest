begin;

-- Recruitment applications and notes are server-mediated. The Next.js API uses
-- the service_role client only after validation, anti-spam checks, and upload checks.
revoke insert, update, delete on public.recruitment_applications from anon, authenticated;
revoke insert, update, delete on public.recruitment_application_notes from anon, authenticated;
grant select on public.recruitment_applications to authenticated;

drop policy if exists "Public can submit recruitment applications" on public.recruitment_applications;
drop policy if exists "Authenticated can submit recruitment applications" on public.recruitment_applications;
drop policy if exists "Admins can update recruitment applications" on public.recruitment_applications;

-- Only anonymous visitors need the public active-job read path; authenticated admins
-- use their admin ALL policy. This removes overlapping permissive SELECT policies.
drop policy if exists "Public can read active recruitment jobs" on public.recruitment_jobs;
create policy "Public can read active recruitment jobs"
on public.recruitment_jobs for select to anon
using (is_active = true and (closes_at is null or closes_at > now()));

-- Avoid per-row auth re-evaluation in notes RLS.
drop policy if exists "Admins can create application notes" on public.recruitment_application_notes;
create policy "Admins can create application notes"
on public.recruitment_application_notes for insert to authenticated
with check ((select private.is_admin()) and admin_user_id = (select auth.uid()));

-- Cover the two existing foreign keys used by admin/audit lookups.
create index if not exists audit_logs_actor_user_id_idx
  on public.audit_logs(actor_user_id);
create index if not exists recruitment_application_notes_admin_user_id_idx
  on public.recruitment_application_notes(admin_user_id);

commit;
