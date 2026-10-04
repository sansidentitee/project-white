create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset text not null,
  direction text not null check (direction in ('long','short')),
  entry numeric not null check (entry > 0),
  exit numeric check (exit is null or exit > 0),
  quantity numeric not null default 1 check (quantity > 0),
  status text not null default 'open' check (status in ('open','closed')),
  setup text,
  note text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.trades enable row level security;
grant select, insert, update, delete on public.trades to authenticated;

create policy "trades own select" on public.trades
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "trades own insert" on public.trades
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "trades own update" on public.trades
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "trades own delete" on public.trades
  for delete to authenticated using ((select auth.uid()) = user_id);

create index if not exists idx_trades_user_opened on public.trades(user_id, opened_at desc);
