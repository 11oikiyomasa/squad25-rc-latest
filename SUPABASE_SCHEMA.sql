-- SQUAD.25 compatibility schema snapshot.
--
-- IMPORTANT: supabase/migrations/ is the canonical source of truth.
-- Do not use this snapshot as the primary provisioning workflow. New schema
-- changes must be added as migrations so clean environments and production
-- migration history remain reproducible.

create table if not exists public.squad_settings (
  id integer primary key default 1 check (id = 1),
  name text not null default 'SQUAD.25',
  tagline text not null default '',
  description text not null default '',
  logo_url text,
  instagram_url text,
  youtube_url text,
  discord_url text,
  updated_at timestamptz not null default now(),
  season text not null default '2026',
  tiktok_url text
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nickname text not null,
  number text not null default '00',
  full_name text,
  role text not null check (role in ('EXP','JUNGLE','MID','GOLD','ROAM')),
  main_hero text,
  bio text not null default '',
  accent text not null default '#d7ff43',
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE','BENCH','CAPTAIN')),
  photo_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.members add column if not exists number text not null default '00';
alter table public.members add column if not exists accent text not null default '#d7ff43';

create table if not exists public.montages (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  title text not null,
  youtube_id text not null default '',
  duration text not null default '00:00',
  hero text,
  description text not null default '',
  published_at date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.montages add column if not exists duration text not null default '00:00';
alter table public.montages add column if not exists content_key text;
create unique index if not exists montages_content_key_unique on public.montages(content_key);
create index if not exists montages_member_id_idx on public.montages(member_id);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event text,
  year integer,
  placement text,
  description text not null default '',
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  caption text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create schema if not exists private;
create or replace function private.is_admin()
returns boolean language sql security definer stable set search_path = public
as $$ select exists (select 1 from public.admin_users where user_id = auth.uid()); $$;
grant execute on function private.is_admin() to authenticated;
revoke all on function private.is_admin() from anon;

insert into public.squad_settings (id, name, tagline, season) values (1, 'SQUAD.25', 'Twenty-five players. One legacy.', '2026')
on conflict (id) do nothing;

alter table public.squad_settings enable row level security;
alter table public.members enable row level security;
alter table public.montages enable row level security;
alter table public.achievements enable row level security;
alter table public.gallery_items enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Public can read squad settings" on public.squad_settings;
create policy "Public can read squad settings" on public.squad_settings for select using (true);
drop policy if exists "Public can read members" on public.members;
create policy "Public can read members" on public.members for select using (true);
drop policy if exists "Public can read montages" on public.montages;
create policy "Public can read montages" on public.montages for select using (true);
drop policy if exists "Public can read achievements" on public.achievements;
create policy "Public can read achievements" on public.achievements for select using (true);
drop policy if exists "Public can read gallery" on public.gallery_items;
create policy "Public can read gallery" on public.gallery_items for select using (true);
drop policy if exists "Admins manage squad settings" on public.squad_settings;
create policy "Admins manage squad settings" on public.squad_settings for all using (private.is_admin()) with check (private.is_admin());
drop policy if exists "Admins manage members" on public.members;
create policy "Admins manage members" on public.members for all using (private.is_admin()) with check (private.is_admin());
drop policy if exists "Admins manage montages" on public.montages;
create policy "Admins manage montages" on public.montages for all using (private.is_admin()) with check (private.is_admin());
drop policy if exists "Admins manage achievements" on public.achievements;
create policy "Admins manage achievements" on public.achievements for all using (private.is_admin()) with check (private.is_admin());
drop policy if exists "Admins manage gallery" on public.gallery_items;
create policy "Admins manage gallery" on public.gallery_items for all using (private.is_admin()) with check (private.is_admin());
drop policy if exists "Admins read admin allowlist" on public.admin_users;
create policy "Admins read admin allowlist" on public.admin_users for select using (private.is_admin() or user_id = auth.uid());

insert into storage.buckets (id, name, public) values ('squad-media','squad-media',true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read squad media" on storage.objects;
create policy "Public can read squad media" on storage.objects for select using (bucket_id = 'squad-media');
drop policy if exists "Admins can upload squad media" on storage.objects;
create policy "Admins can upload squad media" on storage.objects for insert with check (bucket_id = 'squad-media' and private.is_admin());
drop policy if exists "Admins can update squad media" on storage.objects;
create policy "Admins can update squad media" on storage.objects for update using (bucket_id = 'squad-media' and private.is_admin()) with check (bucket_id = 'squad-media' and private.is_admin());
drop policy if exists "Admins can delete squad media" on storage.objects;
create policy "Admins can delete squad media" on storage.objects for delete using (bucket_id = 'squad-media' and private.is_admin());

create or replace function public.publish_squad_content(payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public, private
as $$
declare
  p jsonb;
  m jsonb;
  mt jsonb;
  db_member_id uuid;
  desired_keys text[] := '{}';
  saved_members integer := 0;
  saved_montages integer := 0;
  member_count integer;
  now_ts timestamptz := now();
begin
  if not private.is_admin() then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;
  if jsonb_typeof(payload) <> 'object' then raise exception 'Invalid content payload.' using errcode = '22023'; end if;
  if jsonb_typeof(payload->'profile') <> 'object' then raise exception 'Content must contain a profile.' using errcode = '22023'; end if;
  if jsonb_typeof(payload->'members') <> 'array' then raise exception 'Content must contain a members array.' using errcode = '22023'; end if;
  select jsonb_array_length(payload->'members') into member_count;
  if member_count <> 25 then raise exception 'Content must contain exactly 25 members.' using errcode = '22023'; end if;
  insert into squad_settings (id, name, tagline, description, logo_url, season, instagram_url, tiktok_url, youtube_url, discord_url, updated_at)
  values (1, left(coalesce(payload->'profile'->>'name',''),80), left(coalesce(payload->'profile'->>'tagline',''),180), '', null, left(coalesce(payload->'profile'->>'season',''),20), nullif(left(coalesce(payload->'profile'->>'instagram','#'),300),''), nullif(left(coalesce(payload->'profile'->>'tiktok','#'),300),''), nullif(left(coalesce(payload->'profile'->>'youtube','#'),300),''), null, now_ts)
  on conflict (id) do update set name=excluded.name, tagline=excluded.tagline, season=excluded.season, instagram_url=excluded.instagram_url, tiktok_url=excluded.tiktok_url, youtube_url=excluded.youtube_url, updated_at=now_ts;
  for m in select * from jsonb_array_elements(payload->'members') loop
    if coalesce(m->>'id','') = '' then raise exception 'Member ID is required.' using errcode = '22023'; end if;
    select id into db_member_id from members where slug = m->>'id' limit 1;
    if db_member_id is null then raise exception 'Member slug not found: %', m->>'id' using errcode = '23503'; end if;
    if coalesce(m->>'nickname','') = '' or coalesce(m->>'name','') = '' then raise exception 'Member nickname and name are required: %', m->>'id' using errcode = '22023'; end if;
    if coalesce(m->>'role','') not in ('EXP','JUNGLE','MID','GOLD','ROAM') then raise exception 'Invalid member role: %', m->>'id' using errcode = '22023'; end if;
    if coalesce(m->>'status','') not in ('ACTIVE','BENCH','CAPTAIN') then raise exception 'Invalid member status: %', m->>'id' using errcode = '22023'; end if;
    update members set
      number = left(coalesce(m->>'number', '00'), 10),
      nickname = left(m->>'nickname', 30),
      full_name = left(m->>'name', 80),
      role = m->>'role',
      main_hero = left(coalesce(m->>'hero',''), 50),
      status = m->>'status',
      bio = left(coalesce(m->>'bio',''), 600),
      accent = left(coalesce(m->>'accent','#d7ff43'), 20),
      photo_url = left(coalesce(m->>'photo',''), 500),
      sort_order = greatest(0, (select ordinality - 1 from jsonb_array_elements(payload->'members') with ordinality x(item, ordinality) where x.item = m limit 1)),
      updated_at = now_ts
    where id = db_member_id;
    saved_members := saved_members + 1;
    for mt in select * from jsonb_array_elements(coalesce(m->'montages','[]'::jsonb)) with ordinality as x(item, ordinality) loop
      if coalesce(mt.item->>'title','') = '' then continue; end if;
      desired_keys := array_append(desired_keys, (m->>'id') || ':' || mt.ordinality::text);
      insert into montages (content_key, member_id, title, hero, duration, youtube_id, description, sort_order)
      values ((m->>'id') || ':' || mt.ordinality::text, db_member_id, left(mt.item->>'title',120), left(coalesce(mt.item->>'hero',m->>'hero',''),50), left(coalesce(mt.item->>'duration','00:00'),20), left(coalesce(mt.item->>'youtubeId',''),100), left(coalesce(mt.item->>'description',''),500), mt.ordinality - 1)
      on conflict (content_key) do update set member_id=excluded.member_id, title=excluded.title, hero=excluded.hero, duration=excluded.duration, youtube_id=excluded.youtube_id, description=excluded.description, sort_order=excluded.sort_order;
      saved_montages := saved_montages + 1;
    end loop;
  end loop;
  if coalesce(array_length(desired_keys, 1), 0) = 0 then
    delete from montages;
  else
    delete from montages where not (content_key = any(desired_keys));
  end if;
  return jsonb_build_object('ok', true, 'savedMembers', saved_members, 'savedMontages', saved_montages);
end;
$$;
revoke all on function public.publish_squad_content(jsonb) from public;
grant execute on function public.publish_squad_content(jsonb) to authenticated;
