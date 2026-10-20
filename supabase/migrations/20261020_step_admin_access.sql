-- STEP student directory and admin roles, 2026-10-20
alter table public.step_student_profiles add column if not exists email text;
alter table public.step_student_profiles add column if not exists is_active boolean not null default true;
create table if not exists public.step_admin_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check (role in ('owner','staff')),
 granted_at timestamptz not null default now()
);
alter table public.step_admin_accounts enable row level security;
revoke all on public.step_admin_accounts from public, anon, authenticated;

-- Existing profiles are backfilled from auth.users during deployment.
create or replace function public.step_create_student_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare uname text; contact_phone text;
begin
 if new.raw_user_meta_data ->> 'app_target' is distinct from 'step-grammar' then return new; end if;
 uname := lower(btrim(new.raw_user_meta_data ->> 'username'));
 contact_phone := btrim(new.raw_user_meta_data ->> 'phone_e164');
 if uname is null or uname !~ '^[a-z][a-z0-9_]{2,23}$' then raise exception 'Invalid STEP username'; end if;
 if contact_phone is null or contact_phone !~ '^\+[1-9][0-9]{7,14}$' then raise exception 'Invalid STEP phone'; end if;
 insert into public.step_student_profiles (user_id, username, email, phone_e164)
 values (new.id,uname,new.email,contact_phone);
 return new;
end;
$$;
revoke execute on function public.step_create_student_profile() from public,anon,authenticated;
