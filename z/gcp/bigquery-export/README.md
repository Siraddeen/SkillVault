# BigQuery telemetry export (Cloud Run job)

Periodically exports `telemetry_events` and `ad_impressions` from
Supabase/Postgres into BigQuery, for analytics such as most-viewed
lessons, daily active users, and Free → Premium conversion.

## Why this exists

The product tables (`telemetry_events`, `ad_impressions`) are optimized
for writes from the Edge Functions, not for analytical queries. This
job copies data out into BigQuery on a schedule, where it can be
queried cheaply at scale without touching the production database.

## How it works

- Runs as a **Cloud Run Job** (not a service) — it executes to
  completion and exits, triggered on a schedule rather than serving
  live traffic.
- Each run:
  1. Queries rows where `exported_at IS NULL` (up to `BATCH_SIZE` per
     table)
  2. Inserts them into the matching BigQuery table
  3. On success, marks those rows `exported_at = now()` in Postgres
  4. On failure, leaves rows unmarked — they're safely retried next run

### Why `exported_at`, not a timestamp cursor

An alternative design is a separate "last exported timestamp"
checkpoint. We used a per-row `exported_at` column instead:

- No separate checkpoint table to keep in sync
- A partial failure can't cause double-counting or gaps — unexported
  rows are simply still `NULL` and get picked up next run
- Partial indexes (`WHERE exported_at IS NULL`) keep the "find
  unexported rows" query cheap even as tables grow

### Retry behavior

The BigQuery insert happens **before** the Postgres update. If the
BigQuery insert throws (including partial-failure errors), the
function returns early and the rows stay unmarked — they'll be
included in the next scheduled run. This makes the job safe to retry
and safe to run more frequently than strictly necessary.

## Batch size

`BATCH_SIZE = 500` rows per table per run (constant in `src/index.ts`).
Tune based on table growth and how frequently the job runs.

## Required environment variables

| Variable                    | Description                                         |
| --------------------------- | --------------------------------------------------- |
| `SUPABASE_URL`              | Supabase project URL                                |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS for the export job)  |
| `GCP_PROJECT_ID`            | Target GCP project for BigQuery                     |
| `BQ_DATASET`                | BigQuery dataset name (e.g. `skillvault_analytics`) |

## BigQuery schema

Table schemas are defined in `bq-schema/`:

- `bq-schema/telemetry_events.json`
- `bq-schema/ad_impressions.json`

These should mirror the corresponding Postgres tables. Update both
sides if the schema changes.

## Deployment

```bash
# build & push the image
gcloud builds submit --tag gcr.io/$PROJECT_ID/telemetry-export

# create the Cloud Run Job
gcloud run jobs create telemetry-export \
  --image gcr.io/$PROJECT_ID/telemetry-export \
  --region asia-south1 \
  --set-env-vars SUPABASE_URL=...,SUPABASE_SERVICE_ROLE_KEY=...,GCP_PROJECT_ID=$PROJECT_ID,BQ_DATASET=skillvault_analytics
```

## Scheduling

```bash
# runs every 15 minutes via Cloud Scheduler -> Cloud Run Jobs API
gcloud scheduler jobs create http telemetry-export-schedule \
  --schedule="*/15 * * * *" \
  --uri="https://asia-south1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/$PROJECT_ID/jobs/telemetry-export:run" \
  --http-method=POST \
  --oauth-service-account-email=$SCHEDULER_SA_EMAIL
```

## Status

- [x] Export script (`src/index.ts`)
- [x] Dockerfile
- [x] `package.json` / `tsconfig.json`, type-checks clean
- [ ] Live GCP deployment (deferred until backend + frontend are feature-complete)
- [ ] Cloud Scheduler configured
- [ ] Sample analytical queries (mirror into `/docs/query-plans.md`)

## Future improvements

- Materialized summary tables/views in BigQuery for the frontend
  Analytics page, instead of querying raw event tables directly
- Dead-letter handling for rows that repeatedly fail to export
- Structured logging/alerting on export failures
<!-- # BigQuery telemetry export (Cloud Run job)

Phase 5. Purpose: periodically export `usage_events` from Postgres/Supabase into
BigQuery for analysis (most-viewed lessons, retention, conversion Free -> Premium).

## Plan

1. Small script (Node/TS or Python) that queries new `usage_events` rows since last export
2. Writes them to a BigQuery table (`skillvault.telemetry.usage_events`)
3. Runs on a schedule via Cloud Run + Cloud Scheduler (or a Cloud Run job trigger)
4. Analytics page in the frontend queries BigQuery (or a materialized summary) for:
   - Top lessons by views
   - Daily active users
   - Free -> Premium conversion rate
   - Average session length

## TODO

- [ ] Write export script
- [ ] Dockerfile for Cloud Run
- [ ] Cloud Scheduler config
- [ ] Sample analytical queries (also mirror into /docs/query-plans.md) -->
