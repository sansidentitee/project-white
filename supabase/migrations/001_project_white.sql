create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text default 'A',
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  short_name text not null,
  icon text not null default 'file',
  created_at timestamptz not null default now()
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  status text not null default 'discover' check (status in ('discover','learning','reinforce','solid','mastered')),
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  details text,
  kind text not null default 'homework' check (kind in ('homework','exam','event','study')),
  due_at timestamptz,
  planned_start timestamptz,
  duration_min int not null default 45,
  status text not null default 'todo' check (status in ('todo','partial','blocked','done')),
  quadrant text not null default 'schedule' check (quadrant in ('do','schedule','delegate','eliminate')),
  priority int not null default 2 check (priority between 1 and 4),
  created_at timestamptz not null default now()
);

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  score numeric not null,
  out_of numeric not null default 20,
  coefficient numeric not null default 1,
  taken_at timestamptz not null default now()
);

create table if not exists public.work_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_min int not null,
  outcome text not null check (outcome in ('done','partial','resume','blocked'))
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete set null,
  title text not null,
  url text not null,
  kind text not null check (kind in ('link','file')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.chapters enable row level security;
alter table public.tasks enable row level security;
alter table public.grades enable row level security;
alter table public.work_sessions enable row level security;
alter table public.resources enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.subjects to authenticated;
grant select, insert, update, delete on public.chapters to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.grades to authenticated;
grant select, insert, update, delete on public.work_sessions to authenticated;
grant select, insert, update, delete on public.resources to authenticated;

create policy "profiles own select" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles own insert" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles own update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles own delete" on public.profiles for delete to authenticated using ((select auth.uid()) = id);

create policy "subjects own select" on public.subjects for select to authenticated using ((select auth.uid()) = user_id);
create policy "subjects own insert" on public.subjects for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "subjects own update" on public.subjects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "subjects own delete" on public.subjects for delete to authenticated using ((select auth.uid()) = user_id);

create policy "chapters own select" on public.chapters for select to authenticated using ((select auth.uid()) = user_id);
create policy "chapters own insert" on public.chapters for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "chapters own update" on public.chapters for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "chapters own delete" on public.chapters for delete to authenticated using ((select auth.uid()) = user_id);

create policy "tasks own select" on public.tasks for select to authenticated using ((select auth.uid()) = user_id);
create policy "tasks own insert" on public.tasks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "tasks own update" on public.tasks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "tasks own delete" on public.tasks for delete to authenticated using ((select auth.uid()) = user_id);

create policy "grades own select" on public.grades for select to authenticated using ((select auth.uid()) = user_id);
create policy "grades own insert" on public.grades for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "grades own update" on public.grades for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "grades own delete" on public.grades for delete to authenticated using ((select auth.uid()) = user_id);

create policy "sessions own select" on public.work_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy "sessions own insert" on public.work_sessions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "sessions own update" on public.work_sessions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "sessions own delete" on public.work_sessions for delete to authenticated using ((select auth.uid()) = user_id);

create policy "resources own select" on public.resources for select to authenticated using ((select auth.uid()) = user_id);
create policy "resources own insert" on public.resources for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "resources own update" on public.resources for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "resources own delete" on public.resources for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets(id,name,public) values('resources','resources',true)
  on conflict (id) do update set public=excluded.public;

create policy "resource uploads own folder" on storage.objects for insert to authenticated
  with check (bucket_id='resources' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "resource public read" on storage.objects for select to anon, authenticated
  using (bucket_id='resources');
create policy "resource update own folder" on storage.objects for update to authenticated
  using (bucket_id='resources' and (storage.foldername(name))[1]=(select auth.uid())::text)
  with check (bucket_id='resources' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "resource delete own folder" on storage.objects for delete to authenticated
  using (bucket_id='resources' and (storage.foldername(name))[1]=(select auth.uid())::text);

create index if not exists idx_tasks_user_due on public.tasks(user_id,due_at);
create index if not exists idx_sessions_user_started on public.work_sessions(user_id,started_at desc);
create index if not exists idx_grades_subject on public.grades(subject_id,taken_at desc);
