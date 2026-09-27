create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text default 'A',
  created_at timestamptz not null default now()
);
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, short_name text not null, icon text not null default 'file', created_at timestamptz not null default now()
);
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade, title text not null,
  status text not null default 'discover' check (status in ('discover','learning','reinforce','solid','mastered')), created_at timestamptz not null default now()
);
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null, title text not null, details text,
  kind text not null default 'homework' check (kind in ('homework','exam','event','study')),
  due_at timestamptz, planned_start timestamptz, duration_min int not null default 45,
  status text not null default 'todo' check (status in ('todo','partial','blocked','done')),
  quadrant text not null default 'schedule' check (quadrant in ('do','schedule','delegate','eliminate')),
  priority int not null default 2 check (priority between 1 and 4), created_at timestamptz not null default now()
);
create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade, title text not null,
  score numeric not null, out_of numeric not null default 20, coefficient numeric not null default 1, taken_at timestamptz not null default now()
);
create table if not exists public.work_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null, subject_id uuid references public.subjects(id) on delete set null,
  started_at timestamptz not null, ended_at timestamptz not null, duration_min int not null,
  outcome text not null check (outcome in ('done','partial','resume','blocked'))
);
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade, chapter_id uuid references public.chapters(id) on delete set null,
  title text not null, url text not null, kind text not null check (kind in ('link','file')), created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.chapters enable row level security;
alter table public.tasks enable row level security;
alter table public.grades enable row level security;
alter table public.work_sessions enable row level security;
alter table public.resources enable row level security;

create policy "profiles own rows" on public.profiles for all using (auth.uid()=id) with check (auth.uid()=id);
create policy "subjects own rows" on public.subjects for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "chapters own rows" on public.chapters for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "tasks own rows" on public.tasks for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "grades own rows" on public.grades for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "sessions own rows" on public.work_sessions for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "resources own rows" on public.resources for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,display_name) values(new.id,coalesce(new.raw_user_meta_data->>'display_name','A')) on conflict do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

insert into storage.buckets(id,name,public) values('resources','resources',true) on conflict (id) do nothing;
create policy "resource uploads own folder" on storage.objects for insert to authenticated with check (bucket_id='resources' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "resource public read" on storage.objects for select using (bucket_id='resources');
create policy "resource delete own folder" on storage.objects for delete to authenticated using (bucket_id='resources' and (storage.foldername(name))[1]=auth.uid()::text);

create index if not exists idx_tasks_user_due on public.tasks(user_id,due_at);
create index if not exists idx_sessions_user_started on public.work_sessions(user_id,started_at desc);
create index if not exists idx_grades_subject on public.grades(subject_id,taken_at desc);
