alter table public.members add column if not exists number text not null default '00';
alter table public.members add column if not exists accent text not null default '#d7ff43';
alter table public.montages add column if not exists duration text not null default '00:00';
update public.members set number = lpad(sort_order::text, 2, '0') where number is null or number = '';
update public.members set accent = case mod(sort_order - 1, 5) when 0 then '#d7ff43' when 1 then '#ff6b38' when 2 then '#8cb4ff' when 3 then '#d98cff' else '#5fe8c6' end where accent is null or accent = '';
