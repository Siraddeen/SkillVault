# Architecture

```
React (Next.js)
   |
   v
Supabase Auth  ---------------------------\
   |                                       |
   v                                       |
Supabase Edge Functions (Deno/TS)          |
   |                                       |
   v                                       |
PostgreSQL (Row Level Security)  <---------/
   |
   v
Cloud Storage (avatars, certificates)
   |
   v
BigQuery (telemetry analytics, via Cloud Run export job)
   |
   v
Analytics Dashboard (frontend)
```

## Key design decisions

### RLS tier model

Access tiers (Free / Basic / Premium) are enforced at the database
layer, not just in application code:

- `tier_rank()` — helper function mapping plan name to a numeric rank
  (`free = 0`, `basic = 1`, `premium = 2`)
- `current_user_tier()` — a `SECURITY DEFINER` function that joins
  `subscriptions` + `plans` to resolve the caller's current tier
- `courses` / `lessons` RLS policies compare `tier_rank(content.tier)`
  against `current_user_tier()`:
  - Authenticated users see content at their tier and below
  - Anonymous (logged-out) users see `free`-tier content only —
    consistent with `plans` itself being publicly readable
- `plans`: publicly readable (anyone can view active plans, no auth
  required) — needed for the pricing/subscription page pre-signup
- `orders`: users can view only their own orders; all writes go
  through `service_role` inside Edge Functions, never directly from
  the client
- `subscriptions`: users can view only their own subscription; a
  unique partial index enforces at most one _active_ subscription per
  user

### Payment webhook idempotency

Razorpay webhooks (and retries) are deduplicated via shared logic in
`supabase/functions/_shared/payment.ts`:

- `verifyWebhookSignature` — HMAC verification against the **raw**
  request body (required for webhook signature checks, unlike the
  client-side checkout flow)
- `findOrderByRazorpayOrderId` — looks up the order by Razorpay's
  order ID rather than trusting anything else in the payload
- `markOrderPaid` — idempotent: safe to call multiple times for the
  same order (e.g. if Razorpay retries the webhook), since it checks
  current order status before transitioning it
- `razorpay-webhook/index.ts` is the **authoritative** confirmation
  path (listens for `payment.captured`); `verify-payment/index.ts` is
  only the client-side fast path shown to the user immediately after
  checkout — the webhook is the source of truth

### Telemetry pipeline

- `record-telemetry/index.ts` accepts events with **optional** auth
  (via a dedicated `getOptionalUser()` helper in `_shared/auth.ts`),
  since anonymous/logged-out usage still needs to be tracked
- Events land in `telemetry_events` (nullable `user_id`) and
  `ad_impressions` (per-user ad view tracking, used by
  `ad-frequency/index.ts` to enforce a rolling 24h impression cap for
  free-tier users; paid tiers skip ad logic entirely)
- Both tables have **no RLS policies** — they are write-only via
  `service_role` from Edge Functions, not directly queryable by
  clients
- Export to BigQuery runs as a separate scheduled **Cloud Run Job**
  (`gcp/bigquery-export`), using a per-row `exported_at IS NULL`
  marker rather than a timestamp checkpoint — see
  `gcp/bigquery-export/README.md` for the full design rationale
  (batch size, retry behavior, why this pattern was chosen over a
  watermark/cursor approach)
- Cadence: intended to run every 15 minutes via Cloud Scheduler once
  deployed (deployment deferred until backend + frontend are
  feature-complete — see project status)

## Status

- [x] Auth, payments (create-order, verify-payment, razorpay-webhook)
- [x] RLS schema: plans, orders, subscriptions, courses, lessons
- [x] Telemetry intake + ad frequency capping
- [x] BigQuery export job (code-complete, not yet deployed live)
- [ ] Frontend pages
- [ ] Live GCP deployment (Cloud Run + BigQuery + Scheduler)
<!-- # Architecture

```
React (Next.js)
   |
   v
Supabase Auth  ---------------------------\
   |                                       |
   v                                       |
Supabase Edge Functions (Deno/TS)          |
   |                                       |
   v                                       |
PostgreSQL (Row Level Security)  <---------/
   |
   v
Cloud Storage (avatars, certificates)
   |
   v
BigQuery (telemetry analytics, via Cloud Run export job)
   |
   v
Analytics Dashboard (frontend)
```

## Key design decisions (fill in as built)

- **RLS tier model**: how Free / Basic / Premium / Admin access is enforced at the
  database layer instead of only in application code, and why.
- **Denormalization choices**: e.g. caching `plan_tier` on the `users` row instead of
  always joining `subscriptions`, and the query-plan evidence behind that choice
  (see `query-plans.md`).
- **Webhook idempotency**: how Razorpay webhook retries are deduplicated.
- **Telemetry pipeline**: batching strategy for `record-telemetry`, and the
  Postgres -> BigQuery export cadence. -->
