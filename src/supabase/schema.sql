-- Casting Diagnostic Assistant: shared workshop case register
-- Run in Supabase Dashboard -> SQL Editor. Never expose a service_role key in the website.

create extension if not exists pgcrypto;
create sequence if not exists public.casting_case_ref_seq start 1 increment 1;

create table if not exists public.workshop_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'reviewer', 'admin')),
  display_name text,
  created_at timestamptz not null default now()
);

create or replace function public.create_workshop_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.workshop_profiles (user_id, role) values (new.id, 'member') on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_workshop_profile on auth.users;
create trigger on_auth_user_created_workshop_profile
after insert on auth.users for each row execute procedure public.create_workshop_profile();

create table if not exists public.casting_cases (
  id bigint generated always as identity primary key,
  case_ref text not null unique,
  status text not null default 'draft' check (status in ('draft', 'awaiting_review', 'under_investigation', 'closed')),
  data jsonb not null,
  created_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewer_notes text not null default '',
  corrective_action text not null default '',
  verification_result text not null default '',
  submitted_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.prepare_casting_case()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.case_ref is null or new.case_ref = '' then
      new.case_ref := 'CAST-' || lpad(nextval('public.casting_case_ref_seq')::text, 6, '0');
    end if;
    new.updated_at := now();
  else
    new.updated_at := now();
  end if;

  if new.data is not null and jsonb_typeof(new.data) = 'object' then
    new.data := jsonb_set(new.data, '{setup,caseRef}', to_jsonb(new.case_ref), true);
  end if;

  if tg_op = 'UPDATE' and old.status = 'closed' and new.status is distinct from 'closed' then
    raise exception 'Closed cases cannot be reopened or moved to another status.';
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'under_investigation' or new.status = 'closed' then
      if not exists (select 1 from public.workshop_profiles p where p.user_id = auth.uid() and p.role in ('reviewer','admin')) then
        raise exception 'Only a reviewer can move a case into investigation or close it.';
      end if;
    end if;
    if new.status = 'closed' then
      if old.status <> 'under_investigation' then
        raise exception 'A case must be under investigation before it can be closed.';
      end if;
      if length(trim(coalesce(new.reviewer_notes,''))) = 0
        or length(trim(coalesce(new.corrective_action,''))) = 0
        or length(trim(coalesce(new.verification_result,''))) = 0 then
        raise exception 'Review findings, corrective action, and verification result are required before closure.';
      end if;
      new.closed_at := now();
    elsif new.status <> 'closed' then
      new.closed_at := null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists prepare_casting_case_trigger on public.casting_cases;
create trigger prepare_casting_case_trigger before insert or update on public.casting_cases
for each row execute procedure public.prepare_casting_case();

alter table public.workshop_profiles enable row level security;
alter table public.casting_cases enable row level security;

drop policy if exists "Users can read own workshop profile" on public.workshop_profiles;
create policy "Users can read own workshop profile" on public.workshop_profiles for select to authenticated using (user_id = auth.uid());
-- Role changes are intentionally managed in the Supabase SQL editor by an administrator.

drop policy if exists "Authenticated users can view shared cases" on public.casting_cases;
create policy "Authenticated users can view shared cases" on public.casting_cases for select to authenticated using (true);
drop policy if exists "Users can create cases as themselves" on public.casting_cases;
create policy "Users can create cases as themselves" on public.casting_cases for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "Owners or reviewers can update cases" on public.casting_cases;
create policy "Owners or reviewers can update cases" on public.casting_cases for update to authenticated
using (created_by = auth.uid() or exists (select 1 from public.workshop_profiles me where me.user_id = auth.uid() and me.role in ('reviewer','admin')))
with check (created_by = auth.uid() or exists (select 1 from public.workshop_profiles me where me.user_id = auth.uid() and me.role in ('reviewer','admin')));

-- After creating your first account, promote it to admin in the SQL editor:
-- update public.workshop_profiles set role = 'admin' where user_id = (select id from auth.users where email = 'YOUR-EMAIL-HERE');
-- Then promote designated case reviewers by changing role to 'reviewer'.
