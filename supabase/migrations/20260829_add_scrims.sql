create table if not exists public.scrims (
  id uuid primary key default gen_random_uuid(),
  scheduled_at timestamptz not null,
  opponent_name text not null default 'TBD' check (char_length(opponent_name) between 1 and 80),
  format text not null default 'BO3' check (format in ('BO1','BO2','BO3','BO5')),
  status text not null default 'SCHEDULED' check (status in ('SCHEDULED','LIVE','COMPLETED','CANCELLED')),
  visibility text not null default 'PUBLIC' check (visibility in ('PUBLIC','PRIVATE')),
  result_for integer,
  result_against integer,
  public_note text not null default '',
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'COMPLETED' and result_for is not null and result_against is not null and result_for >= 0 and result_against >= 0) or status <> 'COMPLETED')
);
create index if not exists scrims_scheduled_at_idx on public.scrims(scheduled_at);
create index if not exists scrims_public_idx on public.scrims(visibility, scheduled_at);
alter table public.scrims enable row level security;
drop policy if exists "Public can read public scrims" on public.scrims;
create policy "Public can read public scrims" on public.scrims for select using (visibility = 'PUBLIC');
drop policy if exists "Admins manage scrims" on public.scrims;
create policy "Admins manage scrims" on public.scrims for all using (private.is_admin()) with check (private.is_admin());
