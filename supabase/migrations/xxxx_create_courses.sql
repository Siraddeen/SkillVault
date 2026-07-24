-- 1. Tier ranking — lets us compare tiers as numbers instead of strings
create or replace function public.tier_rank(t text)
returns int
language sql
immutable
as $$
  select case t
    when 'free' then 0
    when 'basic' then 1
    when 'premium' then 2
    else 0
  end;
$$;

-- 2. Resolve the caller's current effective tier from their active subscription.
--    SECURITY DEFINER: runs with the function owner's privileges, bypassing RLS
--    on subscriptions/plans, so this doesn't recurse into the policies we're
--    about to write on courses (which call this function).
create or replace function public.current_user_tier(uid uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select p.tier
      from subscriptions s
      join plans p on p.id = s.plan_id
      where s.user_id = uid
        and s.status = 'active'
      order by public.tier_rank(p.tier) desc
      limit 1
    ),
    'free'
  );
$$;

-- 3. Courses
create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  tier text not null default 'free' check (tier in ('free', 'basic', 'premium')),
  thumbnail_url text,
  created_at timestamptz not null default now()
);

alter table courses enable row level security;

create policy "courses_select_by_tier"
on courses
for select
to authenticated
using (
  public.tier_rank(tier) <= public.tier_rank(public.current_user_tier(auth.uid()))
);

-- 4. Lessons — gated by their parent course's tier, not their own
create table lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  content text,
  video_url text,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

alter table lessons enable row level security;

create policy "lessons_select_by_parent_course_tier"
on lessons
for select
to authenticated
using (
  exists (
    select 1
    from courses c
    where c.id = lessons.course_id
      and public.tier_rank(c.tier) <= public.tier_rank(public.current_user_tier(auth.uid()))
  )
);