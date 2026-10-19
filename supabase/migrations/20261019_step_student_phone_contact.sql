-- STEP Grammar: collect student contact number at registration.
-- Existing profiles remain valid; new STEP signups must provide E.164 format.
alter table public.step_student_profiles
  add column if not exists phone_e164 text;

alter table public.step_student_profiles
  drop constraint if exists step_phone_e164_format;
alter table public.step_student_profiles
  add constraint step_phone_e164_format
  check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{7,14}$');

create or replace function public.step_create_student_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  uname text;
  contact_phone text;
begin
  if new.raw_user_meta_data ->> 'app_target' is distinct from 'step-grammar' then
    return new;
  end if;

  uname := lower(btrim(new.raw_user_meta_data ->> 'username'));
  contact_phone := btrim(new.raw_user_meta_data ->> 'phone_e164');

  if uname is null or uname !~ '^[a-z][a-z0-9_]{2,23}$' then
    raise exception 'Invalid STEP username';
  end if;
  if contact_phone is null or contact_phone !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'Invalid STEP contact phone';
  end if;

  insert into public.step_student_profiles (user_id, username, phone_e164)
  values (new.id, uname, contact_phone);

  return new;
end;
$$;

-- This is a trigger helper only, not a callable RPC endpoint for students.
revoke execute on function public.step_create_student_profile() from public, anon, authenticated;
