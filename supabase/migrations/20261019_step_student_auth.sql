-- STEP Grammar Mastery — Supabase schema for self-service student accounts.
-- Apply only to a dedicated STEP pilot Supabase project.
create table if not exists public.step_student_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  created_at timestamptz not null default now(),
  constraint step_username_format check (username ~ '^[a-z][a-z0-9_]{2,23}$')
);

create table if not exists public.step_part_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_code text not null,
  part_index smallint not null check (part_index >= 0),
  correct_count smallint not null check (correct_count >= 0),
  total_questions smallint not null check (total_questions > 0),
  passed boolean not null,
  attempted_at timestamptz not null default now(),
  constraint step_score_valid check (correct_count <= total_questions)
);
create index if not exists step_part_attempts_user_idx on public.step_part_attempts (user_id,course_code,part_index);

create table if not exists public.step_exam_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_code text not null,
  correct_count smallint not null check (correct_count >= 0),
  total_questions smallint not null check (total_questions > 0),
  attempted_at timestamptz not null default now(),
  constraint step_exam_score_valid check (correct_count <= total_questions)
);
create index if not exists step_exam_attempts_user_idx on public.step_exam_attempts (user_id,course_code);

create table if not exists public.step_active_exams (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_code text not null,
  question_ids text[] not null,
  started_at timestamptz not null default now(),
  primary key (user_id,course_code)
);

alter table public.step_student_profiles enable row level security;
alter table public.step_part_attempts enable row level security;
alter table public.step_exam_attempts enable row level security;
alter table public.step_active_exams enable row level security;
revoke all on public.step_student_profiles, public.step_part_attempts, public.step_exam_attempts, public.step_active_exams from anon;
revoke insert,update,delete on public.step_student_profiles, public.step_part_attempts, public.step_exam_attempts, public.step_active_exams from authenticated;
grant select on public.step_student_profiles, public.step_part_attempts, public.step_exam_attempts, public.step_active_exams to authenticated;

create policy "STEP student reads own profile" on public.step_student_profiles
  for select to authenticated using (auth.uid() = user_id);
create policy "STEP student reads own part scores" on public.step_part_attempts
  for select to authenticated using (auth.uid() = user_id);
create policy "STEP student reads own exam scores" on public.step_exam_attempts
  for select to authenticated using (auth.uid() = user_id);
create policy "STEP student reads own active exam" on public.step_active_exams
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.step_create_student_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare uname text;
begin
  if new.raw_user_meta_data ->> 'app_target' is distinct from 'step-grammar' then
    return new;
  end if;
  uname := lower(btrim(new.raw_user_meta_data ->> 'username'));
  if uname is null or uname !~ '^[a-z][a-z0-9_]{2,23}$' then
    raise exception 'Invalid STEP username';
  end if;
  insert into public.step_student_profiles (user_id,username) values (new.id,uname);
  return new;
end;
$$;
drop trigger if exists step_new_student_account on auth.users;
create trigger step_new_student_account
  after insert on auth.users for each row execute procedure public.step_create_student_profile();
