create table public.daily_reviews (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object' and octet_length(answers::text) <= 100000),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.daily_reviews enable row level security;
create policy "daily_reviews own select" on public.daily_reviews for select to authenticated using ((select auth.uid()) = user_id);
create policy "daily_reviews own insert" on public.daily_reviews for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "daily_reviews own update" on public.daily_reviews for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "daily_reviews own delete" on public.daily_reviews for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.daily_reviews to authenticated;
