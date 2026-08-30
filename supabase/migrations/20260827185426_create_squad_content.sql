-- SQUAD.25 clean-project baseline.
-- The production database accumulated several early migrations before this
-- repository captured the complete schema. This baseline intentionally uses
-- the reconciled current base schema + seed so a fresh project is complete
-- before the feature migrations below are applied.

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
  insert into squad_settings (id,name,tagline,description,logo_url,season,instagram_url,tiktok_url,youtube_url,discord_url,updated_at)
  values (1,left(coalesce(payload->'profile'->>'name',''),80),left(coalesce(payload->'profile'->>'tagline',''),180),'',null,left(coalesce(payload->'profile'->>'season',''),20),nullif(left(coalesce(payload->'profile'->>'instagram','#'),300),''),nullif(left(coalesce(payload->'profile'->>'tiktok','#'),300),''),nullif(left(coalesce(payload->'profile'->>'youtube','#'),300),''),null,now_ts)
  on conflict (id) do update set name=excluded.name,tagline=excluded.tagline,season=excluded.season,instagram_url=excluded.instagram_url,tiktok_url=excluded.tiktok_url,youtube_url=excluded.youtube_url,updated_at=now_ts;
  for m in select * from jsonb_array_elements(payload->'members') loop
    if coalesce(m->>'id','') = '' then raise exception 'Member ID is required.' using errcode = '22023'; end if;
    select id into db_member_id from members where slug = m->>'id' limit 1;
    if db_member_id is null then raise exception 'Member slug not found: %',m->>'id' using errcode='23503'; end if;
    if coalesce(m->>'nickname','')='' or coalesce(m->>'name','')='' then raise exception 'Member nickname and name are required: %',m->>'id' using errcode='22023'; end if;
    if coalesce(m->>'role','') not in ('EXP','JUNGLE','MID','GOLD','ROAM') then raise exception 'Invalid member role: %',m->>'id' using errcode='22023'; end if;
    if coalesce(m->>'status','') not in ('ACTIVE','BENCH','CAPTAIN') then raise exception 'Invalid member status: %',m->>'id' using errcode='22023'; end if;
    update members set
      number=left(coalesce(m->>'number','00'),10),
      nickname=left(m->>'nickname',30),
      full_name=left(m->>'name',80),
      role=m->>'role',
      main_hero=left(coalesce(m->>'hero',''),50),
      status=m->>'status',
      bio=left(coalesce(m->>'bio',''),600),
      accent=left(coalesce(m->>'accent','#d7ff43'),20),
      photo_url=left(coalesce(m->>'photo',''),500),
      sort_order=greatest(0,(select ordinality-1 from jsonb_array_elements(payload->'members') with ordinality x(item,ordinality) where x.item=m limit 1)),
      updated_at=now_ts
    where id=db_member_id;
    saved_members := saved_members + 1;
    for mt in select * from jsonb_array_elements(coalesce(m->'montages','[]'::jsonb)) with ordinality as x(item,ordinality) loop
      if coalesce(mt.item->>'title','')='' then continue; end if;
      desired_keys := array_append(desired_keys,(m->>'id')||':'||mt.ordinality::text);
      insert into montages(content_key,member_id,title,hero,duration,youtube_id,description,sort_order)
      values((m->>'id')||':'||mt.ordinality::text,db_member_id,left(mt.item->>'title',120),left(coalesce(mt.item->>'hero',m->>'hero',''),50),left(coalesce(mt.item->>'duration','00:00'),20),left(coalesce(mt.item->>'youtubeId',''),100),left(coalesce(mt.item->>'description',''),500),mt.ordinality-1)
      on conflict(content_key) do update set member_id=excluded.member_id,title=excluded.title,hero=excluded.hero,duration=excluded.duration,youtube_id=excluded.youtube_id,description=excluded.description,sort_order=excluded.sort_order;
      saved_montages := saved_montages + 1;
    end loop;
  end loop;
  if coalesce(array_length(desired_keys,1),0)=0 then delete from montages; else delete from montages where not(content_key=any(desired_keys)); end if;
  return jsonb_build_object('ok',true,'savedMembers',saved_members,'savedMontages',saved_montages);
end;
$$;
revoke all on function public.publish_squad_content(jsonb) from public;
grant execute on function public.publish_squad_content(jsonb) to authenticated;

-- Reconciled seed. Root SUPABASE_SEED.sql remains as a manual compatibility file,
-- but a clean migration-only bootstrap must also produce a usable roster.
insert into public.members (slug, number, nickname, full_name, role, main_hero, status, bio, accent, photo_url, sort_order)
values
  ('ryuu','01','RYUU','Ryu Andika','EXP','Yu Zhong','CAPTAIN','EXP specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/ryuu.svg',0),
  ('kaze','02','KAZE','Raka Pratama','JUNGLE','Ling','ACTIVE','JUNGLE specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/kaze.svg',1),
  ('nix','03','NIX','Niko Ardi','MID','Yve','ACTIVE','MID specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/nix.svg',2),
  ('vex','04','VEX','Vicky Rama','GOLD','Beatrix','ACTIVE','GOLD specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/vex.svg',3),
  ('mio','05','MIO','Mio Satria','ROAM','Chou','ACTIVE','ROAM specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/mio.svg',4),
  ('kira','06','KIRA','Kiran Putra','EXP','Paquito','ACTIVE','EXP specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/kira.svg',5),
  ('zeno','07','ZENO','Zeno Fajar','JUNGLE','Fanny','ACTIVE','JUNGLE specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/zeno.svg',6),
  ('rei','08','REI','Rei Mahesa','MID','Pharsa','ACTIVE','MID specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/rei.svg',7),
  ('aki','09','AKI','Aki Ramdan','GOLD','Claude','ACTIVE','GOLD specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/aki.svg',8),
  ('raze','10','RAZE','Rafli Zaki','ROAM','Khufra','ACTIVE','ROAM specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/raze.svg',9),
  ('yuki','11','YUKI','Yuki Adnan','EXP','Yu Zhong','ACTIVE','EXP specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/yuki.svg',10),
  ('nero','12','NERO','Nero Alfin','JUNGLE','Ling','ACTIVE','JUNGLE specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/nero.svg',11),
  ('sora','13','SORA','Sora Fikri','MID','Yve','ACTIVE','MID specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/sora.svg',12),
  ('kyo','14','KYO','Kyo Rama','GOLD','Beatrix','ACTIVE','GOLD specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/kyo.svg',13),
  ('jin','15','JIN','Jin Akbar','ROAM','Chou','ACTIVE','ROAM specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/jin.svg',14),
  ('rin','16','RIN','Rin Arga','EXP','Paquito','ACTIVE','EXP specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/rin.svg',15),
  ('shin','17','SHIN','Shin Fajar','JUNGLE','Fanny','ACTIVE','JUNGLE specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/shin.svg',16),
  ('kai','18','KAI','Kai Dimas','MID','Pharsa','ACTIVE','MID specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/kai.svg',17),
  ('zero','19','ZERO','Zero Ilham','GOLD','Claude','ACTIVE','GOLD specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/zero.svg',18),
  ('ren','20','REN','Ren Bagas','ROAM','Khufra','ACTIVE','ROAM specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/ren.svg',19),
  ('zack','21','ZACK','Zack Arya','EXP','Yu Zhong','ACTIVE','EXP specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/zack.svg',20),
  ('hayo','22','HAYO','Hayo Ilham','JUNGLE','Ling','ACTIVE','JUNGLE specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/hayo.svg',21),
  ('aero','23','AERO','Aero Bima','MID','Yve','BENCH','MID specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/aero.svg',22),
  ('onix','24','ONIX','Onix Reza','GOLD','Beatrix','BENCH','GOLD specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/onix.svg',23),
  ('vino','25','VINO','Vino Aditya','ROAM','Chou','BENCH','ROAM specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.','#d7ff43','/images/members/vino.svg',24)
on conflict (slug) do nothing;

insert into public.montages (content_key, member_id, title, hero, duration, youtube_id, description, sort_order)
select m.slug || ':1', m.id, m.nickname || ' — matchday cut', coalesce(m.main_hero,''), '00:42', '', 'Add the member montage URL from Content Studio.', 0
from public.members m
on conflict (content_key) do nothing;
insert into public.montages (content_key, member_id, title, hero, duration, youtube_id, description, sort_order)
select m.slug || ':2', m.id, m.nickname || ' — ranked session', coalesce(m.main_hero,''), '01:08', '', 'Add the member montage URL from Content Studio.', 1
from public.members m
on conflict (content_key) do nothing;
insert into public.achievements (title, event, year, placement, description, sort_order)
select * from (values
  ('Night League — Top 4','Regional open bracket',2026,'Top 4','Regional open bracket',0),
  ('Campus Clash — Champion','Campus Clash',2025,'Champion','Best of 5 final / 3–1',1),
  ('City Scrim Series — Runner-up','City Scrim Series',2025,'Runner-up','Invitational circuit',2)
) as seed(title,event,year,placement,description,sort_order)
where not exists (select 1 from public.achievements);
insert into public.gallery_items (title, image_url, caption, sort_order)
select * from (values
  ('Night queue','/images/gallery/night-queue.svg','Scrim / 01',0),
  ('Draft room','/images/gallery/draft-room.svg','Matchday / 02',1),
  ('After the win','/images/gallery/after-win.svg','Final / 03',2),
  ('Comms check','/images/gallery/comms-check.svg','Practice / 04',3),
  ('Road to bracket','/images/gallery/road-bracket.svg','League / 05',4),
  ('Full squad','/images/gallery/full-squad.svg','Archive / 06',5)
) as seed(title,image_url,caption,sort_order)
where not exists (select 1 from public.gallery_items);
