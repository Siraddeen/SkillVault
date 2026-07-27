-- Analytics RPCs backing /dashboard/analytics.
--
-- These implement the three queries stubbed in docs/query-plans.md, as
-- SECURITY DEFINER functions (same pattern as current_user_tier()) rather
-- than querying telemetry_events/ad_impressions/subscriptions directly from
-- the client. Two reasons:
--   1. telemetry_events has NO select policy at all (write-only by design,
--      see xxxx_create_telemetry_and_ads.sql) — a client-side query would
--      return zero rows regardless of the caller's tier.
--   2. subscriptions/orders are scoped to "view own row only" — analytics
--      needs cross-user aggregates, which only a definer function (or the
--      service_role key) can produce. This avoids putting the service_role
--      key in the Next.js app at all.

-- 1. Top courses by lesson views.
-- Event shape expected: event_type = 'lesson_view',
-- payload = { "course_id": "<uuid>" }.
create or replace function public.analytics_top_courses(result_limit int default 10)
returns table(course_id uuid, title text, view_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select c.id as course_id, c.title, count(*) as view_count
  from telemetry_events te
  join courses c on c.id = (te.payload->>'course_id')::uuid
  where te.event_type = 'lesson_view'
  group by c.id, c.title
  order by view_count desc
  limit result_limit;
$$;

-- 2. Free -> Premium conversion, among paid subscribers.
create or replace function public.analytics_conversion_rate()
returns table(
  active_subscriptions bigint,
  premium_subscriptions bigint,
  conversion_rate numeric
)
language sql
security definer
set search_path = public
stable
as $$
  select
    count(*) filter (where s.status = 'active') as active_subscriptions,
    count(*) filter (where s.status = 'active' and p.name = 'premium') as premium_subscriptions,
    case
      when count(*) filter (where s.status = 'active') = 0 then 0
      else round(
        100.0 * count(*) filter (where s.status = 'active' and p.name = 'premium')
        / count(*) filter (where s.status = 'active'),
        1
      )
    end as conversion_rate
  from subscriptions s
  join plans p on p.id = s.plan_id;
$$;

-- 3. Daily active users over the trailing N days.
create or replace function public.analytics_dau(days int default 30)
returns table(day date, dau bigint)
language sql
security definer
set search_path = public
stable
as $$
  select date_trunc('day', created_at)::date as day, count(distinct user_id) as dau
  from telemetry_events
  where user_id is not null
    and created_at >= now() - (days || ' days')::interval
  group by 1
  order by 1 desc;
$$;