create or replace function public.admin_update_recruitment_application_v7(
  application_id uuid, next_status text, expected_status text, note_text text, client_ip text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  current_row public.recruitment_applications%rowtype;
  actor_name text;
  clean_note text := left(btrim(coalesce(note_text,'')), 2000);
  now_ts timestamptz := clock_timestamp();
  ip inet;
begin
  if auth.role() <> 'authenticated' or not private.is_admin() then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
  if next_status not in ('NEW','REVIEWING','SHORTLISTED','ACCEPTED','REJECTED') then raise exception 'INVALID_STATUS' using errcode='22023'; end if;
  select * into current_row from public.recruitment_applications where id=application_id for update;
  if not found then raise exception 'APPLICATION_NOT_FOUND' using errcode='P0002'; end if;
  if expected_status <> '' and expected_status <> current_row.status then raise exception 'STALE_APPLICATION' using errcode='40001'; end if;
  if current_row.status <> next_status and not (
    (current_row.status='NEW' and next_status in ('REVIEWING','REJECTED')) or
    (current_row.status='REVIEWING' and next_status in ('SHORTLISTED','REJECTED')) or
    (current_row.status='SHORTLISTED' and next_status in ('ACCEPTED','REJECTED'))
  ) then raise exception 'INVALID_TRANSITION' using errcode='22023'; end if;
  if current_row.status = next_status and clean_note = '' then raise exception 'NO_CHANGE' using errcode='22023'; end if;

  select coalesce(nullif(u.raw_user_meta_data->>'full_name',''), nullif(u.raw_user_meta_data->>'name',''), u.email, 'Admin') into actor_name from auth.users u where u.id=auth.uid();
  update public.recruitment_applications set status=next_status, reviewed_at=now_ts, updated_at=now_ts where id=application_id;
  if clean_note <> '' then
    insert into public.recruitment_application_notes(application_id,admin_user_id,admin_name,note) values(application_id,auth.uid(),left(actor_name,120),clean_note);
  end if;
  begin ip := nullif(split_part(coalesce(client_ip,''),',',1),'')::inet; exception when invalid_text_representation then ip := null; end;
  insert into public.audit_logs(actor_user_id,actor_name,action,entity_type,entity_id,before_data,after_data,ip)
  values(auth.uid(),left(actor_name,120),case when current_row.status=next_status then 'APPLICATION_NOTE_ADDED' else 'APPLICATION_STATUS_CHANGED' end,'recruitment_application',application_id,
    jsonb_build_object('status',current_row.status),jsonb_build_object('status',next_status,'noteAdded',clean_note<>''),ip);
  return jsonb_build_object('ok',true,'id',application_id,'status',next_status);
end;
$$;
revoke all on function public.admin_update_recruitment_application_v7(uuid,text,text,text,text) from public, anon;
grant execute on function public.admin_update_recruitment_application_v7(uuid,text,text,text,text) to authenticated;
