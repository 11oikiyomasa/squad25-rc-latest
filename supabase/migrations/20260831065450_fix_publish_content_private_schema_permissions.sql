-- Fix admin publish RPC access to the private authorization schema.
-- The function performs privileged writes only after private.is_admin() verifies
-- auth.uid(). SECURITY DEFINER is required because authenticated clients do not
-- have USAGE on the private schema. Keep the search_path restricted to public.

alter function public.publish_squad_content(jsonb) security definer;
alter function public.publish_squad_content(jsonb) set search_path = public;

revoke all on function public.publish_squad_content(jsonb) from public;
revoke execute on function public.publish_squad_content(jsonb) from anon;
grant execute on function public.publish_squad_content(jsonb) to authenticated;
grant execute on function public.publish_squad_content(jsonb) to service_role;
