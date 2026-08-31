begin;

-- Phase 9 data-layer lock.
-- This migration reconciles the existing schema with the locked Phase 9 contract.
-- Match/Scrim persistence is intentionally untouched.

-- ============================================================
-- 1. Publication state + required Member identity
-- ============================================================

alter table public.members
  add column if not exists publish_state text;

update public.members
set publish_state = 'PUBLISHED'
where publish_state is null;

alter table public.members
  alter column publish_state set default 'UNPUBLISHED',
  alter column publish_state set not null;

drop constraint if exists members_status_check on public.members;
alter table public.members
  drop constraint if exists members_status_check;
alter table public.members
  add constraint members_status_check_v1
  check (status in ('ACTIVE','BENCH','CAPTAIN'));

alter table public.members
  alter column full_name set not null;

-- ============================================================
-- 2. Media publication state + updated_at invariants
-- ============================================================

alter table public.montages
  add column if not exists publish_state text,
  add column if not exists updated_at timestamptz;

update public.montages
set publish_state = 'PUBLISHED'
where publish_state is null;

update public.montages
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

alter table public.montages
  alter column publish_state set default 'UNPUBLISHED',
  alter column publish_state set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

alter table public.gallery_items
  add column if not exists publish_state text,
  add column if not exists updated_at timestamptz;

update public.gallery_items
set publish_state = 'PUBLISHED'
where publish_state is null;

update public.gallery_items
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

alter table public.gallery_items
  alter column publish_state set default 'UNPUBLISHED',
  alter column publish_state set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

alter table public.montages
  drop constraint if exists montages_publish_state_check;
alter table public.montages
  add constraint montages_publish_state_check
  check (publish_state in ('PUBLISHED','UNPUBLISHED'));

alter table public.gallery_items
  drop constraint if exists gallery_items_publish_state_check;
alter table public.gallery_items
  add constraint gallery_items_publish_state_check
  check (publish_state in ('PUBLISHED','UNPUBLISHED'));

-- ============================================================
-- 3. Recruitment Cycle entity + Opening relationship
-- ============================================================

create table if not exists public.recruitment_cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'CLOSED',
  starts_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recruitment_cycles_status_check
    check (status in ('OPEN','CLOSED')),
  constraint recruitment_cycles_dates_check
    check (closes_at is null or starts_at is null or closes_at > starts_at),
  constraint recruitment_cycles_name_check
    check (char_length(btrim(name)) between 1 and 120)
);

alter table public.recruitment_jobs
  add column if not exists cycle_id uuid;

-- The current production environment was checked before this migration and has
-- zero recruitment jobs. Do not invent a legacy Cycle row; existing jobs must be
-- explicitly reconciled before this constraint can be applied in another environment.
do $$
begin
  if exists (select 1 from public.recruitment_jobs where cycle_id is null) then
    raise exception 'PHASE9_REQUIRES_RECRUITMENT_JOB_CYCLE_ID_BACKFILL';
  end if;
end
$$;

alter table public.recruitment_jobs
  alter column cycle_id set not null;

alter table public.recruitment_jobs
  drop constraint if exists recruitment_jobs_cycle_id_fkey;
alter table public.recruitment_jobs
  add constraint recruitment_jobs_cycle_id_fkey
  foreign key (cycle_id)
  references public.recruitment_cycles(id)
  on delete restrict;

create index if not exists recruitment_jobs_cycle_active_idx
  on public.recruitment_jobs (cycle_id, is_active, created_at desc);

create index if not exists recruitment_cycles_status_closes_idx
  on public.recruitment_cycles (status, closes_at);

-- ============================================================
-- 4. Application required-field contract
-- ============================================================

alter table public.recruitment_applications
  alter column job_id set not null,
  alter column phone set not null,
  alter column resume_path set not null,
  alter column resume_original_name set not null,
  alter column resume_size set not null,
  alter column captcha_verified_at set not null;

alter table public.recruitment_applications
  drop constraint if exists recruitment_applications_phone_check;
alter table public.recruitment_applications
  add constraint recruitment_applications_phone_check
  check (char_length(btrim(phone)) between 3 and 40);

alter table public.recruitment_applications
  drop constraint if exists recruitment_applications_cover_letter_check;
alter table public.recruitment_applications
  add constraint recruitment_applications_cover_letter_check
  check (char_length(btrim(cover_letter)) between 20 and 5000);

alter table public.recruitment_applications
  drop constraint if exists recruitment_applications_resume_size_check;
alter table public.recruitment_applications
  add constraint recruitment_applications_resume_size_check
  check (resume_size > 0 and resume_size <= 5242880);

alter table public.recruitment_applications
  drop constraint if exists recruitment_applications_resume_original_name_check;
alter table public.recruitment_applications
  add constraint recruitment_applications_resume_original_name_check
  check (char_length(resume_original_name) between 1 and 255);

alter table public.recruitment_applications
  drop constraint if exists recruitment_applications_resume_path_check;
alter table public.recruitment_applications
  add constraint recruitment_applications_resume_path_check
  check (resume_path ~ '^applications/[0-9a-f-]{36}\\.pdf$');

alter table public.recruitment_applications
  drop constraint if exists recruitment_applications_role_check;
alter table public.recruitment_applications
  add constraint recruitment_applications_role_check
  check (role in ('EXP','JUNGLE','MID','GOLD','ROAM','FLEX'));

alter table public.recruitment_applications
  drop constraint if exists recruitment_applications_status_check;
alter table public.recruitment_applications
  add constraint recruitment_applications_status_check
  check (status in ('NEW','REVIEWING','SHORTLISTED','ACCEPTED','REJECTED'));

-- Phase 7/9 duplicate invariant: normalized email + same Recruitment Opening.
drop index if exists public.recruitment_applications_email_job_uidx;
create unique index recruitment_applications_email_job_uidx
  on public.recruitment_applications (lower(email), job_id);

create index if not exists recruitment_applications_job_created_idx
  on public.recruitment_applications (job_id, created_at desc);

create index if not exists recruitment_applications_status_created_idx
  on public.recruitment_applications (status, created_at desc);

-- ============================================================
-- 5. updated_at trigger
-- ============================================================

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public, private
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

drop trigger if exists set_updated_at_montages on public.montages;
create trigger set_updated_at_montages
before update on public.montages
for each row execute function private.set_updated_at();

drop trigger if exists set_updated_at_gallery_items on public.gallery_items;
create trigger set_updated_at_gallery_items
before update on public.gallery_items
for each row execute function private.set_updated_at();

drop trigger if exists set_updated_at_recruitment_cycles on public.recruitment_cycles;
create trigger set_updated_at_recruitment_cycles
before update on public.recruitment_cycles
for each row execute function private.set_updated_at();

-- ============================================================
-- 6. RLS: public publication + recruitment eligibility
-- ============================================================

alter table public.recruitment_cycles enable row level security;
alter table public.recruitment_jobs enable row level security;
alter table public.recruitment_applications enable row level security;
alter table public.recruitment_application_notes enable row level security;
alter table public.audit_logs enable row level security;
alter table public.members enable row level security;
alter table public.montages enable row level security;
alter table public.gallery_items enable row level security;

-- Members: public sees only published records.
drop policy if exists "public read members" on public.members;
drop policy if exists "Public can read members" on public.members;
create policy "public read published members"
on public.members for select to public
using (publish_state = 'PUBLISHED');

-- Montages: public sees only published records.
drop policy if exists "public read montages" on public.montages;
drop policy if exists "Public can read montages" on public.montages;
create policy "public read published montages"
on public.montages for select to public
using (publish_state = 'PUBLISHED');

-- Gallery: public sees only published records.
drop policy if exists "public read gallery" on public.gallery_items;
drop policy if exists "Public can read gallery" on public.gallery_items;
create policy "public read published gallery"
on public.gallery_items for select to public
using (publish_state = 'PUBLISHED');

-- Recruitment Cycle: public reads only OPEN cycles.
drop policy if exists "public read open recruitment cycles" on public.recruitment_cycles;
create policy "public read open recruitment cycles"
on public.recruitment_cycles for select to anon, authenticated
using (status = 'OPEN');

-- Recruitment jobs: anon/authenticated may read only eligible openings;
-- Admin policy remains independently authorized.
drop policy if exists "Public can read active recruitment jobs" on public.recruitment_jobs;
create policy "public read eligible recruitment jobs"
on public.recruitment_jobs for select to anon, authenticated
using (
  is_active = true
  and (closes_at is null or closes_at > now())
  and exists (
    select 1
    from public.recruitment_cycles c
    where c.id = recruitment_jobs.cycle_id
      and c.status = 'OPEN'
      and (c.starts_at is null or c.starts_at <= now())
      and (c.closes_at is null or c.closes_at > now())
  )
);

-- Applications: no direct client INSERT/UPDATE/DELETE. Admin SELECT remains the
-- only authenticated table-read policy; submission is server-mediated.
revoke select, insert, update, delete on public.recruitment_applications from anon;
revoke insert, update, delete on public.recruitment_applications from authenticated;

drop policy if exists "Admins can read recruitment applications" on public.recruitment_applications;
create policy "Admins can read recruitment applications"
on public.recruitment_applications for select to authenticated
using ((select private.is_admin()));

drop policy if exists "Public can submit recruitment applications" on public.recruitment_applications;
drop policy if exists "Authenticated can submit recruitment applications" on public.recruitment_applications;
drop policy if exists "Admins can update recruitment applications" on public.recruitment_applications;

-- Application notes stay private and append-only for Admins.
revoke select, insert, update, delete on public.recruitment_application_notes from anon, authenticated;
drop policy if exists "Admins can read application notes" on public.recruitment_application_notes;
drop policy if exists "Admins can create application notes" on public.recruitment_application_notes;
create policy "Admins can read application notes"
on public.recruitment_application_notes for select to authenticated
using ((select private.is_admin()));
create policy "Admins can create application notes"
on public.recruitment_application_notes for insert to authenticated
with check ((select private.is_admin()) and admin_user_id = (select auth.uid()));

-- Audit logs are Admin read-only from the database client.
revoke select, insert, update, delete on public.audit_logs from anon, authenticated;
drop policy if exists "Admins can read audit logs" on public.audit_logs;
create policy "Admins can read audit logs"
on public.audit_logs for select to authenticated
using ((select private.is_admin()));

-- Recruitment Cycles: Admin-only management.
drop policy if exists "Admins manage recruitment cycles" on public.recruitment_cycles;
create policy "Admins manage recruitment cycles"
on public.recruitment_cycles for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

-- Preserve Admin management policies for Members/Montages/Gallery and tighten
-- them to explicit Admin authorization if their old policy names exist.
drop policy if exists "Admins manage members" on public.members;
drop policy if exists "admin insert members" on public.members;
drop policy if exists "admin update members" on public.members;
drop policy if exists "admin delete members" on public.members;
create policy "Admins manage members"
on public.members for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "Admins manage montages" on public.montages;
drop policy if exists "admin insert montages" on public.montages;
drop policy if exists "admin update montages" on public.montages;
drop policy if exists "admin delete montages" on public.montages;
create policy "Admins manage montages"
on public.montages for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "Admins manage gallery" on public.gallery_items;
drop policy if exists "admin insert gallery" on public.gallery_items;
drop policy if exists "admin update gallery" on public.gallery_items;
drop policy if exists "admin delete gallery" on public.gallery_items;
create policy "Admins manage gallery"
on public.gallery_items for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

-- ============================================================
-- 7. Storage contracts
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('squad-media', 'squad-media', true, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recruitment-resumes', 'recruitment-resumes', false, 5242880, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public squad media: read public, write Admin only.
drop policy if exists "Public can read squad media" on storage.objects;
drop policy if exists "squad media admin select" on storage.objects;
drop policy if exists "squad media admin insert" on storage.objects;
drop policy if exists "squad media admin update" on storage.objects;
drop policy if exists "squad media admin delete" on storage.objects;
create policy "public read squad media"
on storage.objects for select to public
using (bucket_id = 'squad-media');
create policy "admins insert squad media"
on storage.objects for insert to authenticated
with check (bucket_id = 'squad-media' and (select private.is_admin()));
create policy "admins update squad media"
on storage.objects for update to authenticated
using (bucket_id = 'squad-media' and (select private.is_admin()))
with check (bucket_id = 'squad-media' and (select private.is_admin()));
create policy "admins delete squad media"
on storage.objects for delete to authenticated
using (bucket_id = 'squad-media' and (select private.is_admin()));

-- Recruitment resumes: no direct client access; trusted server/service-role only.
drop policy if exists "Admins can read recruitment resumes" on storage.objects;
drop policy if exists "Admins can delete recruitment resumes" on storage.objects;
drop policy if exists "recruitment resume admin read" on storage.objects;
drop policy if exists "recruitment resume admin delete" on storage.objects;

-- ============================================================
-- 8. Supporting indexes
-- ============================================================

create index if not exists members_publish_sort_idx
  on public.members (publish_state, sort_order);

create index if not exists montages_publish_member_sort_idx
  on public.montages (publish_state, member_id, sort_order);

create index if not exists gallery_publish_sort_idx
  on public.gallery_items (publish_state, sort_order);

commit;
