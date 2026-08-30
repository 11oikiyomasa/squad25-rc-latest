create table if not exists public.recruitment_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text not null check (char_length(full_name) between 2 and 80),
  nickname text not null check (char_length(nickname) between 1 and 30),
  role text not null check (role in ('EXP','JUNGLE','MID','GOLD','ROAM','FLEX')),
  rank text not null default '' check (char_length(rank) <= 60),
  hero_pool text not null default '' check (char_length(hero_pool) <= 240),
  experience text not null default '' check (char_length(experience) <= 1200),
  availability text not null default '' check (char_length(availability) <= 300),
  contact text not null check (char_length(contact) between 3 and 120),
  social_url text not null default '' check (char_length(social_url) <= 300),
  message text not null default '' check (char_length(message) <= 1600),
  status text not null default 'NEW' check (status in ('NEW','REVIEWING','SHORTLISTED','REJECTED','HIRED')),
  admin_note text not null default '' check (char_length(admin_note) <= 1600),
  reviewed_at timestamptz,
  source text not null default 'website' check (source = 'website')
);

create index if not exists recruitment_applications_created_at_idx on public.recruitment_applications (created_at desc);
create index if not exists recruitment_applications_status_idx on public.recruitment_applications (status, created_at desc);

alter table public.recruitment_applications enable row level security;

drop policy if exists "Public can submit recruitment applications" on public.recruitment_applications;
create policy "Public can submit recruitment applications"
on public.recruitment_applications
for insert
to anon
with check (
  status = 'NEW'
  and source = 'website'
  and admin_note = ''
  and reviewed_at is null
);

drop policy if exists "Admins can read recruitment applications" on public.recruitment_applications;
create policy "Admins can read recruitment applications"
on public.recruitment_applications
for select
to authenticated
using (private.is_admin());

drop policy if exists "Admins can update recruitment applications" on public.recruitment_applications;
create policy "Admins can update recruitment applications"
on public.recruitment_applications
for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

revoke all on table public.recruitment_applications from anon, authenticated;
grant insert on table public.recruitment_applications to anon;
grant select, update on table public.recruitment_applications to authenticated;
