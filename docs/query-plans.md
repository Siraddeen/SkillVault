# Query Plans & Optimization Notes

This doc is the direct answer to the JD's "strong SQL: you can read a query
plan and know when to denormalize" requirement — treat it as an interview
artifact, not just internal notes.

For each query below: paste the query, the `EXPLAIN ANALYZE` output before
optimization, what you changed (index / denormalization / rewrite), and the
output after. These are stubbed with the real table/column names from the
schema — still need to be run against real (or seeded) data once the
frontend/analytics page is far enough along to generate meaningful volume.

## Query 1: Top courses by views

```sql
-- before
select c.id, c.title, count(*) as view_count
from telemetry_events te
join courses c on c.id = (te.event_data->>'course_id')::uuid
where te.event_type = 'lesson_view'
group by c.id, c.title
order by view_count desc
limit 10;
```

```
-- EXPLAIN ANALYZE output (before): TODO — run once telemetry_events has volume
```

- What changed:
- `EXPLAIN ANALYZE` output (after):

## Query 2: Free -> Premium conversion rate

```sql
-- before
select
  count(*) filter (where s.status = 'active' and p.name = 'premium') as premium_active,
  count(*) filter (where s.status = 'active') as all_active
from subscriptions s
join plans p on p.id = s.plan_id;
```

```
-- EXPLAIN ANALYZE output (before): TODO
```

- What changed:
- `EXPLAIN ANALYZE` output (after):

## Query 3: Daily active users

```sql
-- before
select date_trunc('day', created_at) as day, count(distinct user_id) as dau
from telemetry_events
where user_id is not null
group by 1
order by 1 desc;
```

```
-- EXPLAIN ANALYZE output (before): TODO
```

- What changed:
- `EXPLAIN ANALYZE` output (after):

## Denormalization decisions

- **`current_user_tier()` as `SECURITY DEFINER`, not a cached column**:
  chose a function that joins `subscriptions` + `plans` at query time
  over caching `plan_tier` directly on `users`, since RLS checks need
  to reflect subscription status immediately (e.g. expiry, cancellation)
  rather than a potentially-stale cached value. Revisit this if RLS
  check latency becomes a measured problem — the read/write tradeoff
  of caching `plan_tier` on `users` would need before/after
  `EXPLAIN ANALYZE` evidence here.
- **`exported_at` per-row marker vs. a checkpoint table** (BigQuery
  export): see `gcp/bigquery-export/README.md` — avoids a separate
  watermark table and makes partial export failures self-healing via
  partial indexes on `WHERE exported_at IS NULL`.

<!-- # Query Plans & Optimization Notes

Phase 7. This doc is the direct answer to the JD's "strong SQL: you can read a query
plan and know when to denormalize" requirement — treat it as an interview artifact,
not just internal notes.

For each query below: paste the query, the `EXPLAIN ANALYZE` output before optimization,
what you changed (index / denormalization / rewrite), and the output after.

## Query 1: Top courses by views

```sql
-- before
```

## Query 2: Free -> Premium conversion rate

```sql
-- before
```

## Query 3: Daily active users

```sql
-- before
```

## Denormalization decisions

- Example: caching `plan_tier` on `users` instead of joining `subscriptions` on every
  RLS check — explain the read/write tradeoff here once implemented. -->
