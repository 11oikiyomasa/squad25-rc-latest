-- Restrict scrim admin policies to authenticated admins and avoid
-- permissive SELECT policy overlap between anonymous/public and admin reads.

drop policy if exists "Public can read public scrims" on public.scrims;
drop policy if exists "Admins manage scrims" on public.scrims;

create policy "Public can read public scrims"
on public.scrims
for select
to anon
using (visibility = 'PUBLIC');

create policy "Authenticated can read public or admin scrims"
on public.scrims
for select
to authenticated
using (visibility = 'PUBLIC' or private.is_admin());

create policy "Admins can insert scrims"
on public.scrims
for insert
to authenticated
with check (private.is_admin());

create policy "Admins can update scrims"
on public.scrims
for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "Admins can delete scrims"
on public.scrims
for delete
to authenticated
using (private.is_admin());
