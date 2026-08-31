begin;

alter table public.achievements
  add column if not exists updated_at timestamptz;

update public.achievements
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

alter table public.achievements
  alter column updated_at set default now(),
  alter column updated_at set not null;

create trigger set_updated_at_achievements
before update on public.achievements
for each row execute function private.set_updated_at();

create index if not exists achievements_sort_idx
  on public.achievements (sort_order, created_at desc);

commit;
