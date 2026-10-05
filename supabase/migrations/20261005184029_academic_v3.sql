alter table public.tasks add column if not exists completed_at timestamptz;
alter table public.academic_errors add column if not exists chapter_id uuid references public.chapters(id) on delete set null;
alter table public.academic_errors add column if not exists interval_days numeric not null default 0 check (interval_days >= 0);
alter table public.academic_errors add column if not exists repetitions integer not null default 0 check (repetitions >= 0);
alter table public.academic_errors add column if not exists lapses integer not null default 0 check (lapses >= 0);
alter table public.academic_errors add column if not exists last_reviewed_at timestamptz;
alter table public.academic_goals add column if not exists subject_id uuid references public.subjects(id) on delete set null;
alter table public.academic_preferences add column if not exists dashboard_widgets jsonb;
alter table public.academic_preferences add column if not exists tutorial_completed boolean not null default false;
