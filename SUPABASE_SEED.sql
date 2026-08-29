-- Idempotent content seed for SQUAD.25. Run after SUPABASE_SCHEMA.sql.

insert into public.squad_settings (id, name, tagline, season)
values (1, 'SQUAD.25', 'Twenty-five players. One legacy.', '2026')
on conflict (id) do nothing;

insert into public.members (slug, number, nickname, full_name, role, main_hero, status, bio, accent, photo_url, sort_order)
values
  ('ryuu', '01', 'RYUU', 'Ryu Andika', 'EXP', 'Yu Zhong', 'CAPTAIN', 'EXP specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/ryuu.svg', 0),
  ('kaze', '02', 'KAZE', 'Raka Pratama', 'JUNGLE', 'Ling', 'ACTIVE', 'JUNGLE specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/kaze.svg', 1),
  ('nix', '03', 'NIX', 'Niko Ardi', 'MID', 'Yve', 'ACTIVE', 'MID specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/nix.svg', 2),
  ('vex', '04', 'VEX', 'Vicky Rama', 'GOLD', 'Beatrix', 'ACTIVE', 'GOLD specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/vex.svg', 3),
  ('mio', '05', 'MIO', 'Mio Satria', 'ROAM', 'Chou', 'ACTIVE', 'ROAM specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/mio.svg', 4),
  ('kira', '06', 'KIRA', 'Kiran Putra', 'EXP', 'Paquito', 'ACTIVE', 'EXP specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/kira.svg', 5),
  ('zeno', '07', 'ZENO', 'Zeno Fajar', 'JUNGLE', 'Fanny', 'ACTIVE', 'JUNGLE specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/zeno.svg', 6),
  ('rei', '08', 'REI', 'Rei Mahesa', 'MID', 'Pharsa', 'ACTIVE', 'MID specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/rei.svg', 7),
  ('aki', '09', 'AKI', 'Aki Ramdan', 'GOLD', 'Claude', 'ACTIVE', 'GOLD specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/aki.svg', 8),
  ('raze', '10', 'RAZE', 'Rafli Zaki', 'ROAM', 'Khufra', 'ACTIVE', 'ROAM specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/raze.svg', 9),
  ('yuki', '11', 'YUKI', 'Yuki Adnan', 'EXP', 'Yu Zhong', 'ACTIVE', 'EXP specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/yuki.svg', 10),
  ('nero', '12', 'NERO', 'Nero Alfin', 'JUNGLE', 'Ling', 'ACTIVE', 'JUNGLE specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/nero.svg', 11),
  ('sora', '13', 'SORA', 'Sora Fikri', 'MID', 'Yve', 'ACTIVE', 'MID specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/sora.svg', 12),
  ('kyo', '14', 'KYO', 'Kyo Rama', 'GOLD', 'Beatrix', 'ACTIVE', 'GOLD specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/kyo.svg', 13),
  ('jin', '15', 'JIN', 'Jin Akbar', 'ROAM', 'Chou', 'ACTIVE', 'ROAM specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/jin.svg', 14),
  ('rin', '16', 'RIN', 'Rin Arga', 'EXP', 'Paquito', 'ACTIVE', 'EXP specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/rin.svg', 15),
  ('shin', '17', 'SHIN', 'Shin Fajar', 'JUNGLE', 'Fanny', 'ACTIVE', 'JUNGLE specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/shin.svg', 16),
  ('kai', '18', 'KAI', 'Kai Dimas', 'MID', 'Pharsa', 'ACTIVE', 'MID specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/kai.svg', 17),
  ('zero', '19', 'ZERO', 'Zero Ilham', 'GOLD', 'Claude', 'ACTIVE', 'GOLD specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/zero.svg', 18),
  ('ren', '20', 'REN', 'Ren Bagas', 'ROAM', 'Khufra', 'ACTIVE', 'ROAM specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/ren.svg', 19),
  ('zack', '21', 'ZACK', 'Zack Arya', 'EXP', 'Yu Zhong', 'ACTIVE', 'EXP specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/zack.svg', 20),
  ('hayo', '22', 'HAYO', 'Hayo Ilham', 'JUNGLE', 'Ling', 'ACTIVE', 'JUNGLE specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/hayo.svg', 21),
  ('aero', '23', 'AERO', 'Aero Bima', 'MID', 'Yve', 'BENCH', 'MID specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/aero.svg', 22),
  ('onix', '24', 'ONIX', 'Onix Reza', 'GOLD', 'Beatrix', 'BENCH', 'GOLD specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/onix.svg', 23),
  ('vino', '25', 'VINO', 'Vino Aditya', 'ROAM', 'Chou', 'BENCH', 'ROAM specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.', '#d7ff43', '/images/members/vino.svg', 24)
 on conflict (slug) do nothing;

insert into public.montages (content_key, member_id, title, hero, duration, youtube_id, description, sort_order)
select m.slug || ':1', m.id, m.nickname || ' — matchday cut', coalesce(m.main_hero, ''), '00:42', '', 'Add the member montage URL from Content Studio.', 0
from public.members m
on conflict (content_key) do nothing;

insert into public.montages (content_key, member_id, title, hero, duration, youtube_id, description, sort_order)
select m.slug || ':2', m.id, m.nickname || ' — ranked session', coalesce(m.main_hero, ''), '01:08', '', 'Add the member montage URL from Content Studio.', 1
from public.members m
on conflict (content_key) do nothing;

insert into public.achievements (title, event, year, placement, description, sort_order)
select * from (values
  ('Night League — Top 4', 'Regional open bracket', 2026, 'Top 4', 'Regional open bracket', 0),
  ('Campus Clash — Champion', 'Campus Clash', 2025, 'Champion', 'Best of 5 final / 3–1', 1),
  ('City Scrim Series — Runner-up', 'City Scrim Series', 2025, 'Runner-up', 'Invitational circuit', 2)
) as seed(title,event,year,placement,description,sort_order)
where not exists (select 1 from public.achievements);

insert into public.gallery_items (title, image_url, caption, sort_order)
select * from (values
  ('Night queue', '/images/gallery/night-queue.svg', 'Scrim / 01', 0),
  ('Draft room', '/images/gallery/draft-room.svg', 'Matchday / 02', 1),
  ('After the win', '/images/gallery/after-win.svg', 'Final / 03', 2),
  ('Comms check', '/images/gallery/comms-check.svg', 'Practice / 04', 3),
  ('Road to bracket', '/images/gallery/road-bracket.svg', 'League / 05', 4),
  ('Full squad', '/images/gallery/full-squad.svg', 'Archive / 06', 5)
) as seed(title,image_url,caption,sort_order)
where not exists (select 1 from public.gallery_items);
