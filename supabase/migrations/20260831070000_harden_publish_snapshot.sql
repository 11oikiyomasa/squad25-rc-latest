-- Extend the admin content publisher so the complete ContentSnapshot is atomic.
-- The API validates the public snapshot and this SECURITY INVOKER function
-- persists profile, roster/montages, achievements, and gallery in one transaction.

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
  a jsonb;
  g jsonb;
  db_member_id uuid;
  desired_keys text[] := '{}';
  saved_members integer := 0;
  saved_montages integer := 0;
  saved_achievements integer := 0;
  saved_gallery integer := 0;
  member_count integer;
  now_ts timestamptz := now();
begin
  if not private.is_admin() then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;
  if jsonb_typeof(payload) <> 'object' then
    raise exception 'Invalid content payload.' using errcode = '22023';
  end if;
  if jsonb_typeof(payload->'profile') <> 'object' then
    raise exception 'Content must contain a profile.' using errcode = '22023';
  end if;
  if jsonb_typeof(payload->'members') <> 'array' then
    raise exception 'Content must contain a members array.' using errcode = '22023';
  end if;
  if jsonb_typeof(payload->'achievements') <> 'array' then
    raise exception 'Content must contain an achievements array.' using errcode = '22023';
  end if;
  if jsonb_typeof(payload->'gallery') <> 'array' then
    raise exception 'Content must contain a gallery array.' using errcode = '22023';
  end if;

  select jsonb_array_length(payload->'members') into member_count;
  if member_count <> 25 then
    raise exception 'Content must contain exactly 25 members.' using errcode = '22023';
  end if;

  insert into squad_settings (id,name,tagline,description,logo_url,season,instagram_url,tiktok_url,youtube_url,discord_url,updated_at)
  values (
    1,
    left(coalesce(payload->'profile'->>'name',''),80),
    left(coalesce(payload->'profile'->>'tagline',''),180),
    '',
    null,
    left(coalesce(payload->'profile'->>'season',''),20),
    nullif(left(coalesce(payload->'profile'->>'instagram','#'),300),''),
    nullif(left(coalesce(payload->'profile'->>'tiktok','#'),300),''),
    nullif(left(coalesce(payload->'profile'->>'youtube','#'),300),''),
    null,
    now_ts
  )
  on conflict (id) do update set
    name=excluded.name,
    tagline=excluded.tagline,
    season=excluded.season,
    instagram_url=excluded.instagram_url,
    tiktok_url=excluded.tiktok_url,
    youtube_url=excluded.youtube_url,
    updated_at=now_ts;

  for m in select * from jsonb_array_elements(payload->'members') loop
    if coalesce(m->>'id','') = '' then
      raise exception 'Member ID is required.' using errcode = '22023';
    end if;

    select id into db_member_id from members where slug = m->>'id' limit 1;
    if db_member_id is null then
      raise exception 'Member slug not found: %',m->>'id' using errcode='23503';
    end if;
    if coalesce(m->>'nickname','')='' or coalesce(m->>'name','')='' then
      raise exception 'Member nickname and name are required: %',m->>'id' using errcode='22023';
    end if;
    if coalesce(m->>'role','') not in ('EXP','JUNGLE','MID','GOLD','ROAM') then
      raise exception 'Invalid member role: %',m->>'id' using errcode='22023';
    end if;
    if coalesce(m->>'status','') not in ('ACTIVE','BENCH','CAPTAIN') then
      raise exception 'Invalid member status: %',m->>'id' using errcode='22023';
    end if;

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
      values(
        (m->>'id')||':'||mt.ordinality::text,
        db_member_id,
        left(mt.item->>'title',120),
        left(coalesce(mt.item->>'hero',m->>'hero',''),50),
        left(coalesce(mt.item->>'duration','00:00'),20),
        left(coalesce(mt.item->>'youtubeId',''),100),
        left(coalesce(mt.item->>'description',''),500),
        mt.ordinality-1
      )
      on conflict(content_key) do update set
        member_id=excluded.member_id,
        title=excluded.title,
        hero=excluded.hero,
        duration=excluded.duration,
        youtube_id=excluded.youtube_id,
        description=excluded.description,
        sort_order=excluded.sort_order;
      saved_montages := saved_montages + 1;
    end loop;
  end loop;

  if coalesce(array_length(desired_keys,1),0)=0 then
    delete from montages;
  else
    delete from montages where not(content_key=any(desired_keys));
  end if;

  delete from achievements;
  for a in select * from jsonb_array_elements(payload->'achievements') with ordinality as x(item,ordinality) loop
    if coalesce(a.item->>'title','')='' then continue; end if;
    insert into achievements(title,event,year,placement,description,image_url,sort_order)
    values (
      left(a.item->>'title',160),
      null,
      case when (a.item->>'year') ~ '^\d{4}$' then (a.item->>'year')::integer else null end,
      null,
      left(coalesce(a.item->>'description',''),600),
      null,
      a.ordinality-1
    );
    saved_achievements := saved_achievements + 1;
  end loop;

  delete from gallery_items;
  for g in select * from jsonb_array_elements(payload->'gallery') with ordinality as x(item,ordinality) loop
    if coalesce(g.item->>'title','')='' or coalesce(g.item->>'image_url','')='' then continue; end if;
    insert into gallery_items(title,image_url,caption,sort_order)
    values (
      left(g.item->>'title',160),
      left(g.item->>'image_url',800),
      left(coalesce(g.item->>'caption',''),300),
      g.ordinality-1
    );
    saved_gallery := saved_gallery + 1;
  end loop;

  return jsonb_build_object(
    'ok',true,
    'savedMembers',saved_members,
    'savedMontages',saved_montages,
    'savedAchievements',saved_achievements,
    'savedGallery',saved_gallery
  );
end;
$$;

revoke all on function public.publish_squad_content(jsonb) from public;
grant execute on function public.publish_squad_content(jsonb) to authenticated;
