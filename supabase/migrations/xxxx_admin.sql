-- supabase/migrations/xxxx_admin.sql

alter table public.profiles add column if not exists is_admin boolean not null default false;

-- reusable helper: used in RLS policies below and in admin_list_users()
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

create policy "Admins can insert courses"
  on public.courses for insert
  with check (public.is_admin(auth.uid()));

create policy "Admins can update courses"
  on public.courses for update
  using (public.is_admin(auth.uid()));

create policy "Admins can delete courses"
  on public.courses for delete
  using (public.is_admin(auth.uid()));

-- admin-only view joining auth.users (which the client can never query directly)
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  is_admin boolean,
  tier text,
  subscription_status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not authorized';
  end if;

  return query
  select
    u.id,
    u.email,
    p.is_admin,
    coalesce(pl.name, 'free') as tier,
    s.status as subscription_status,
    u.created_at
  from auth.users u
  join public.profiles p on p.id = u.id
  left join public.subscriptions s on s.user_id = u.id and s.status = 'active'
  left join public.plans pl on pl.id = s.plan_id
  order by u.created_at desc;
end;
$$;