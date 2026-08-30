alter table public.scrims add column if not exists event_name text not null default 'Scrim Session' check (char_length(event_name) between 1 and 120);
alter table public.scrims add column if not exists recap_url text;
alter table public.scrims add column if not exists media_url text;
alter table public.scrims drop constraint if exists scrims_completed_result_check;
alter table public.scrims drop constraint if exists scrims_state_result_check;
alter table public.scrims add constraint scrims_state_result_check check (
  (status = 'COMPLETED' and result_for is not null and result_against is not null and result_for >= 0 and result_against >= 0)
  or (status = 'LIVE' and ((result_for is null and result_against is null) or (result_for >= 0 and result_against >= 0)))
  or (status in ('SCHEDULED','CANCELLED') and result_for is null and result_against is null)
);
create or replace function private.enforce_scrim_lifecycle()
returns trigger
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if tg_op = 'UPDATE' and new.status <> old.status then
    if not (
      (old.status = 'SCHEDULED' and new.status in ('LIVE','CANCELLED'))
      or (old.status = 'LIVE' and new.status in ('COMPLETED','CANCELLED'))
    ) then
      raise exception 'Invalid scrim lifecycle transition: % -> %', old.status, new.status using errcode = '22023';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists scrims_lifecycle_guard on public.scrims;
create trigger scrims_lifecycle_guard before update on public.scrims for each row execute function private.enforce_scrim_lifecycle();
revoke all on function private.enforce_scrim_lifecycle() from public, anon, authenticated;
