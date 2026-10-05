create table public.life_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  universe text not null check (universe in ('islam','finance','health')),
  kind text not null,
  title text not null check (length(trim(title)) between 1 and 300),
  day date not null,
  value numeric check (value is null or value >= 0),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  record_key text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  constraint life_entries_kind_universe check (
    (universe = 'islam' and kind in ('prayers','quran','memorization','learning','goal','resource','reflection')) or
    (universe = 'finance' and kind in ('plan','learning','goal','resource','reflection')) or
    (universe = 'health' and kind in ('health-day','habit','habit-check','workout','goal','resource','reflection'))
  ),
  unique (user_id, universe, kind, record_key)
);
create index life_entries_user_universe_day on public.life_entries(user_id, universe, day desc);
alter table public.life_entries enable row level security;
revoke all on public.life_entries from anon;
grant select, insert, update on public.life_entries to authenticated;
create policy "life entries own select" on public.life_entries for select to authenticated using ((select auth.uid()) = user_id);
create policy "life entries own insert" on public.life_entries for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "life entries own update" on public.life_entries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit) values ('life-resources','life-resources',false,2097152) on conflict (id) do nothing;
create policy "life files own select" on storage.objects for select to authenticated using (bucket_id='life-resources' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "life files own insert" on storage.objects for insert to authenticated with check (bucket_id='life-resources' and (storage.foldername(name))[1] = (select auth.uid())::text);
