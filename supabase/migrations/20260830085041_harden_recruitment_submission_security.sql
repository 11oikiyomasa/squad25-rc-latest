-- Keep the public recruitment RPC invoker-only. The private trigger owns the
-- elevated access required for rate-limit state and is not exposed via the Data API.

create or replace function private.enforce_recruitment_submission_limits()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  request_ip inet;
  ip_record private.recruitment_rate_limits%rowtype;
  normalized_contact text;
  recent_submission timestamptz;
  retry_after integer;
  now_ts timestamptz := clock_timestamp();
  raw_ip text := nullif(btrim(current_setting('request.recruitment_ip', true)), '');
begin
  if auth.role() not in ('anon', 'authenticated') then
    return new;
  end if;

  if auth.role() = 'authenticated' and private.is_admin() then
    return new;
  end if;

  if raw_ip is null then
    raw_ip := nullif(btrim((coalesce(nullif(current_setting('request.headers', true), ''), '{}'))::json->>'x-forwarded-for'), '');
  end if;

  if raw_ip is null then
    raw_ip := nullif(btrim((coalesce(nullif(current_setting('request.headers', true), ''), '{}'))::json->>'x-real-ip'), '');
  end if;

  begin
    request_ip := nullif(split_part(coalesce(raw_ip, ''), ',', 1), '')::inet;
  exception when invalid_text_representation then
    request_ip := null;
  end;

  if request_ip is null then
    request_ip := '0.0.0.0'::inet;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('recruitment-ip:' || request_ip::text, 0));

  select * into ip_record
  from private.recruitment_rate_limits
  where ip = request_ip
  for update;

  if found and ip_record.window_started_at > now_ts - interval '15 minutes'
     and ip_record.request_count >= 5 then
    retry_after := greatest(1, ceil(extract(epoch from (ip_record.window_started_at + interval '15 minutes' - now_ts)))::integer);
    raise exception using errcode = 'P0001', message = 'RECRUITMENT_RATE_LIMIT', detail = retry_after::text;
  end if;

  insert into private.recruitment_rate_limits(ip, window_started_at, request_count, updated_at)
  values(request_ip, now_ts, 1, now_ts)
  on conflict (ip) do update set
    window_started_at = case
      when private.recruitment_rate_limits.window_started_at <= now_ts - interval '15 minutes'
        then excluded.window_started_at
      else private.recruitment_rate_limits.window_started_at
    end,
    request_count = case
      when private.recruitment_rate_limits.window_started_at <= now_ts - interval '15 minutes'
        then 1
      else private.recruitment_rate_limits.request_count + 1
    end,
    updated_at = now_ts;

  normalized_contact := lower(regexp_replace(btrim(new.contact), '[[:space:]]+', ' ', 'g'));
  perform pg_advisory_xact_lock(hashtextextended('recruitment-contact:' || normalized_contact, 0));

  select min(created_at) into recent_submission
  from public.recruitment_applications
  where lower(regexp_replace(btrim(contact), '[[:space:]]+', ' ', 'g')) = normalized_contact
    and created_at > now_ts - interval '24 hours';

  if recent_submission is not null then
    retry_after := greatest(1, ceil(extract(epoch from (recent_submission + interval '24 hours' - now_ts)))::integer);
    raise exception using errcode = 'P0001', message = 'RECRUITMENT_CONTACT_COOLDOWN', detail = retry_after::text;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_recruitment_submission_limits() from public, anon, authenticated;

drop trigger if exists enforce_recruitment_submission_limits on public.recruitment_applications;
create trigger enforce_recruitment_submission_limits
before insert on public.recruitment_applications
for each row execute function private.enforce_recruitment_submission_limits();

create or replace function public.submit_recruitment_application(payload jsonb, client_ip text)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  body jsonb := coalesce(payload, '{}'::jsonb);
  full_name text;
  nickname text;
  role text;
  rank text;
  hero_pool text;
  experience text;
  availability text;
  contact text;
  social_url text;
  message text;
begin
  if auth.role() not in ('anon', 'authenticated') then
    raise exception 'Unauthorized.' using errcode = '42501';
  end if;
  if jsonb_typeof(body) <> 'object' then
    raise exception 'Invalid application payload.' using errcode = '22023';
  end if;
  if coalesce(btrim(body->>'website'), '') <> '' then
    return jsonb_build_object('ok', true);
  end if;

  full_name := left(btrim(coalesce(body->>'fullName', '')), 80);
  nickname := left(btrim(coalesce(body->>'nickname', '')), 30);
  role := upper(left(btrim(coalesce(body->>'role', '')), 10));
  rank := left(btrim(coalesce(body->>'rank', '')), 60);
  hero_pool := left(btrim(coalesce(body->>'heroPool', '')), 240);
  experience := left(btrim(coalesce(body->>'experience', '')), 1200);
  availability := left(btrim(coalesce(body->>'availability', '')), 300);
  contact := left(btrim(coalesce(body->>'contact', '')), 120);
  social_url := left(btrim(coalesce(body->>'socialUrl', '')), 300);
  message := left(btrim(coalesce(body->>'message', '')), 1600);

  if char_length(full_name) < 2 or char_length(nickname) < 1
     or role not in ('EXP', 'JUNGLE', 'MID', 'GOLD', 'ROAM', 'FLEX')
     or char_length(contact) < 3 then
    raise exception 'Required application fields are invalid.' using errcode = '22023';
  end if;

  if social_url <> '' and social_url !~* '^https?://[^[:space:]]+$' then
    raise exception 'Social URL is invalid.' using errcode = '22023';
  end if;

  perform set_config('request.recruitment_ip', left(coalesce(client_ip, ''), 64), true);

  insert into public.recruitment_applications (
    full_name, nickname, role, rank, hero_pool, experience, availability,
    contact, social_url, message, status, admin_note, reviewed_at, source
  ) values (
    full_name, nickname, role, rank, hero_pool, experience, availability,
    contact, social_url, message, 'NEW', '', null, 'website'
  );

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.submit_recruitment_application(jsonb, text) from public;
grant execute on function public.submit_recruitment_application(jsonb, text) to anon, authenticated;
