-- Security hardening: the v7 submission RPC must never be callable directly by a browser.
-- The Next.js API route performs Turnstile, multipart/PDF, size and file checks first,
-- then calls this RPC with the Supabase service_role client.

create or replace function public.submit_recruitment_application_v7(payload jsonb, client_ip text)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  body jsonb := coalesce(payload, '{}');
  v_job uuid;
  v_email text;
  v_name text;
  v_phone text;
  v_portfolio text;
  v_cover text;
  v_role text;
  v_nickname text;
  v_resume_path text;
  v_resume_size integer;
  v_id uuid;
  request_ip inet;
  ip_record private.recruitment_rate_limits%rowtype;
  now_ts timestamptz := clock_timestamp();
begin
  if auth.role() <> 'service_role' then
    raise exception 'SERVER_ONLY_SUBMISSION' using errcode = '42501';
  end if;

  if jsonb_typeof(body) <> 'object' then
    raise exception 'Invalid application payload.' using errcode = '22023';
  end if;

  begin
    v_job := nullif(body->>'jobId', '')::uuid;
  exception when invalid_text_representation then
    raise exception 'JOB_UNAVAILABLE' using errcode = '22023';
  end;

  v_email := lower(btrim(coalesce(body->>'email', '')));
  v_name := btrim(coalesce(body->>'fullName', ''));
  v_phone := btrim(coalesce(body->>'phone', ''));
  v_portfolio := btrim(coalesce(body->>'portfolioLink', ''));
  v_cover := btrim(coalesce(body->>'coverLetter', ''));
  v_role := upper(btrim(coalesce(body->>'role', 'FLEX')));
  v_nickname := btrim(coalesce(body->>'nickname', ''));
  v_resume_path := nullif(btrim(coalesce(body->>'resumePath', '')), '');

  begin
    v_resume_size := nullif(body->>'resumeSize', '')::integer;
  exception when invalid_text_representation then
    raise exception 'INVALID_RESUME' using errcode = '22023';
  end;

  if v_job is null or not exists (
    select 1 from public.recruitment_jobs j
    where j.id = v_job and j.is_active and (j.closes_at is null or j.closes_at > now())
  ) then
    raise exception 'JOB_UNAVAILABLE' using errcode = '22023';
  end if;

  if v_name !~ '^.{2,80}$' or v_nickname !~ '^.{1,30}$' then
    raise exception 'INVALID_NAME' using errcode = '22023';
  end if;

  if v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'INVALID_EMAIL' using errcode = '22023';
  end if;

  if char_length(v_phone) < 3 or char_length(v_phone) > 40 then
    raise exception 'INVALID_PHONE' using errcode = '22023';
  end if;

  if char_length(v_cover) > 5000 or char_length(v_portfolio) > 500 then
    raise exception 'INVALID_TEXT' using errcode = '22023';
  end if;

  if v_role not in ('EXP','JUNGLE','MID','GOLD','ROAM','FLEX') then
    raise exception 'INVALID_ROLE' using errcode = '22023';
  end if;

  if v_resume_path is null
     or v_resume_path !~ '^applications/[0-9a-f-]{36}\.pdf$'
     or v_resume_size is null
     or v_resume_size <= 0
     or v_resume_size > 5242880 then
    raise exception 'INVALID_RESUME' using errcode = '22023';
  end if;

  -- The public API uploads to the private bucket before reaching this function.
  -- Since service_role is the only caller, a browser cannot forge a resume path
  -- through PostgREST or bypass Turnstile by invoking this function directly.
  if not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'recruitment-resumes'
      and o.name = v_resume_path
  ) then
    raise exception 'INVALID_RESUME' using errcode = '22023';
  end if;

  begin
    request_ip := nullif(btrim(client_ip), '')::inet;
  exception when invalid_text_representation then
    request_ip := null;
  end;
  if request_ip is null then request_ip := '0.0.0.0'::inet; end if;

  perform pg_advisory_xact_lock(hashtextextended('recruitment-v7-ip:' || request_ip::text, 0));

  select * into ip_record
  from private.recruitment_rate_limits
  where ip = request_ip
  for update;

  if found and ip_record.window_started_at > now_ts - interval '1 hour' and ip_record.request_count >= 3 then
    raise exception 'RECRUITMENT_RATE_LIMIT'
      using errcode = 'P0001',
            detail = greatest(1, ceil(extract(epoch from (ip_record.window_started_at + interval '1 hour' - now_ts)))::integer)::text;
  end if;

  insert into private.recruitment_rate_limits(ip, window_started_at, request_count, updated_at)
  values(request_ip, now_ts, 1, now_ts)
  on conflict(ip) do update set
    window_started_at = case
      when private.recruitment_rate_limits.window_started_at <= now_ts - interval '1 hour'
        then excluded.window_started_at else private.recruitment_rate_limits.window_started_at end,
    request_count = case
      when private.recruitment_rate_limits.window_started_at <= now_ts - interval '1 hour'
        then 1 else private.recruitment_rate_limits.request_count + 1 end,
    updated_at = now_ts;

  if exists (
    select 1 from public.recruitment_applications
    where lower(email) = v_email and job_id = v_job
  ) then
    raise exception 'DUPLICATE_APPLICATION' using errcode = '23505';
  end if;

  v_id := gen_random_uuid();

  insert into public.recruitment_applications (
    id, job_id, email, phone, full_name, nickname, role,
    portfolio_link, cover_letter, resume_path, resume_size,
    status, admin_note, reviewed_at, source, captcha_verified_at
  ) values (
    v_id, v_job, v_email, v_phone, v_name, v_nickname, v_role,
    v_portfolio, v_cover, v_resume_path, v_resume_size,
    'NEW', '', null, 'website', now()
  );

  return v_id;
exception when unique_violation then
  raise exception 'DUPLICATE_APPLICATION' using errcode = '23505';
end;
$$;

revoke all on function public.submit_recruitment_application_v7(jsonb, text) from public, anon, authenticated;
grant execute on function public.submit_recruitment_application_v7(jsonb, text) to service_role;
