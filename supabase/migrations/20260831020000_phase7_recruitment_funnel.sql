-- Phase 7: production recruitment funnel.
-- Legacy recruitment rows remain readable; new public submissions require a job,
-- candidate email, and a private resume object.

create table if not exists public.recruitment_jobs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null check (char_length(title) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 8000),
  requirements text[] not null default '{}',
  is_active boolean not null default true,
  closes_at timestamptz
);

create index if not exists recruitment_jobs_active_idx
  on public.recruitment_jobs (is_active, created_at desc);

alter table public.recruitment_applications
  add column if not exists job_id uuid references public.recruitment_jobs(id) on delete restrict,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists portfolio_link text not null default '',
  add column if not exists cover_letter text not null default '',
  add column if not exists resume_path text,
  add column if not exists resume_original_name text,
  add column if not exists resume_size integer,
  add column if not exists resume_sha256 text,
  add column if not exists captcha_verified_at timestamptz;

update public.recruitment_applications
set email = lower(btrim(coalesce(email, 'legacy-' || id::text || '@invalid.local')))
where email is null;

alter table public.recruitment_applications
  alter column email set not null;

alter table public.recruitment_applications
  drop constraint if exists recruitment_applications_status_check;
alter table public.recruitment_applications
  add constraint recruitment_applications_status_check
  check (status in ('NEW','REVIEWING','SHORTLISTED','ACCEPTED','REJECTED'));

alter table public.recruitment_applications
  add constraint recruitment_applications_email_check
  check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  add constraint recruitment_applications_phone_check
  check (char_length(phone) <= 40),
  add constraint recruitment_applications_portfolio_check
  check (char_length(portfolio_link) <= 500),
  add constraint recruitment_applications_cover_letter_check
  check (char_length(cover_letter) <= 5000),
  add constraint recruitment_applications_resume_size_check
  check (resume_size is null or (resume_size > 0 and resume_size <= 5242880));

create unique index if not exists recruitment_applications_email_job_uidx
  on public.recruitment_applications (lower(email), job_id)
  where job_id is not null;
create index if not exists recruitment_applications_job_created_idx
  on public.recruitment_applications (job_id, created_at desc);
create index if not exists recruitment_applications_email_idx
  on public.recruitment_applications (lower(email));

create table if not exists public.recruitment_application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.recruitment_applications(id) on delete cascade,
  admin_user_id uuid not null references auth.users(id) on delete restrict,
  admin_name text not null check (char_length(admin_name) between 1 and 120),
  note text not null check (char_length(note) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists recruitment_application_notes_application_idx
  on public.recruitment_application_notes (application_id, created_at desc);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_name text not null default '',
  action text not null check (char_length(action) between 1 and 80),
  entity_type text not null check (char_length(entity_type) between 1 and 80),
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip inet
);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);

alter table public.recruitment_jobs enable row level security;
alter table public.recruitment_application_notes enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Public can read active recruitment jobs" on public.recruitment_jobs;
create policy "Public can read active recruitment jobs"
on public.recruitment_jobs for select to anon, authenticated
using (is_active = true and (closes_at is null or closes_at > now()));

drop policy if exists "Admins can manage recruitment jobs" on public.recruitment_jobs;
create policy "Admins can manage recruitment jobs"
on public.recruitment_jobs for all to authenticated
using (private.is_admin()) with check (private.is_admin());

drop policy if exists "Admins can read application notes" on public.recruitment_application_notes;
create policy "Admins can read application notes"
on public.recruitment_application_notes for select to authenticated using (private.is_admin());
drop policy if exists "Admins can create application notes" on public.recruitment_application_notes;
create policy "Admins can create application notes"
on public.recruitment_application_notes for insert to authenticated with check (private.is_admin() and admin_user_id = auth.uid());

drop policy if exists "Admins can read audit logs" on public.audit_logs;
create policy "Admins can read audit logs"
on public.audit_logs for select to authenticated using (private.is_admin());

revoke all on public.recruitment_jobs from anon, authenticated;
grant select on public.recruitment_jobs to anon, authenticated;
grant insert, update, delete on public.recruitment_jobs to authenticated;
revoke all on public.recruitment_application_notes from anon, authenticated;
grant select, insert on public.recruitment_application_notes to authenticated;
revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;

-- Private resume bucket. Never expose resumes through a public object URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recruitment-resumes', 'recruitment-resumes', false, 5242880, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = array['application/pdf'];

drop policy if exists "Admins can read recruitment resumes" on storage.objects;
create policy "Admins can read recruitment resumes"
on storage.objects for select to authenticated
using (bucket_id = 'recruitment-resumes' and private.is_admin());

drop policy if exists "Admins can delete recruitment resumes" on storage.objects;
create policy "Admins can delete recruitment resumes"
on storage.objects for delete to authenticated
using (bucket_id = 'recruitment-resumes' and private.is_admin());

-- Atomic public submission. File bytes are uploaded by the server after this
-- validation succeeds; resume_path is then attached to the created row.
create or replace function public.submit_recruitment_application_v7(payload jsonb, client_ip text)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  body jsonb := coalesce(payload, '{}'::jsonb);
  v_job uuid := nullif(body->>'jobId','')::uuid;
  v_email text := lower(btrim(coalesce(body->>'email','')));
  v_name text := btrim(coalesce(body->>'fullName',''));
  v_phone text := btrim(coalesce(body->>'phone',''));
  v_portfolio text := btrim(coalesce(body->>'portfolioLink',''));
  v_cover text := btrim(coalesce(body->>'coverLetter',''));
  v_role text := upper(btrim(coalesce(body->>'role','FLEX')));
  v_nickname text := btrim(coalesce(body->>'nickname',''));
  v_resume_path text := nullif(btrim(coalesce(body->>'resumePath','')), '');
  v_resume_size integer := nullif(body->>'resumeSize','')::integer;
  v_id uuid;
begin
  if auth.role() not in ('anon','authenticated') then raise exception 'Unauthorized.' using errcode='42501'; end if;
  if coalesce(btrim(body->>'website'),'') <> '' then return null; end if;
  if v_job is null or not exists (select 1 from public.recruitment_jobs j where j.id=v_job and j.is_active and (j.closes_at is null or j.closes_at > now())) then raise exception 'JOB_UNAVAILABLE' using errcode='22023'; end if;
  if v_name !~ '^.{2,80}$' or v_nickname !~ '^.{1,30}$' then raise exception 'INVALID_NAME' using errcode='22023'; end if;
  if v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'INVALID_EMAIL' using errcode='22023'; end if;
  if char_length(v_phone) < 3 or char_length(v_phone) > 40 then raise exception 'INVALID_PHONE' using errcode='22023'; end if;
  if char_length(v_cover) > 5000 or char_length(v_portfolio) > 500 then raise exception 'INVALID_TEXT' using errcode='22023'; end if;
  if v_role not in ('EXP','JUNGLE','MID','GOLD','ROAM','FLEX') then raise exception 'INVALID_ROLE' using errcode='22023'; end if;
  if v_resume_path is null or v_resume_size is null or v_resume_size <= 0 or v_resume_size > 5242880 then raise exception 'INVALID_RESUME' using errcode='22023'; end if;

  if exists (select 1 from public.recruitment_applications where lower(email)=v_email and job_id=v_job) then raise exception 'DUPLICATE_APPLICATION' using errcode='23505'; end if;

  v_id := gen_random_uuid();
  insert into public.recruitment_applications (
    id, job_id, email, phone, full_name, nickname, role, rank, hero_pool,
    experience, availability, contact, social_url, message, portfolio_link,
    cover_letter, resume_path, resume_size, status, admin_note, reviewed_at, source,
    captcha_verified_at
  ) values (
    v_id, v_job, v_email, v_phone, v_name, v_nickname, v_role, '', '',
    '', '', v_phone, v_portfolio, '', v_portfolio, v_cover, v_resume_path,
    v_resume_size, 'NEW', '', null, 'website', now()
  );
  return v_id;
exception when unique_violation then
  raise exception 'DUPLICATE_APPLICATION' using errcode='23505';
end;
$$;

revoke all on function public.submit_recruitment_application_v7(jsonb,text) from public, anon, authenticated;
grant execute on function public.submit_recruitment_application_v7(jsonb,text) to anon, authenticated;
