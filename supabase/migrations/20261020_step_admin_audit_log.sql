create table if not exists public.step_admin_audit_log (
 id bigint generated always as identity primary key,
 admin_user_id uuid not null references auth.users(id),
 student_user_id uuid not null references auth.users(id),
 action text not null check (action in ('activate','suspend')),
 created_at timestamptz not null default now()
);
alter table public.step_admin_audit_log enable row level security;
revoke all on public.step_admin_audit_log from public, anon, authenticated;