-- The public submission function is SECURITY INVOKER, so the caller must retain
-- INSERT access to the target table. RLS constrains the row and the private
-- trigger enforces the submission rate limit and contact cooldown.

drop policy if exists "Authenticated can submit recruitment applications" on public.recruitment_applications;
create policy "Authenticated can submit recruitment applications"
on public.recruitment_applications
for insert
to authenticated
with check (
  status = 'NEW'
  and source = 'website'
  and admin_note = ''
  and reviewed_at is null
);

grant insert on table public.recruitment_applications to anon, authenticated;
