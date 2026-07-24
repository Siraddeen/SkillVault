# SkillVault

A course/roadmap platform built as a backend-engineering case study — demonstrating
PostgreSQL schema design, Row Level Security for tiered access, Supabase Edge Functions,
Razorpay payment integration, and light GCP infra (Cloud Run, Cloud Storage, BigQuery).

Frontend is intentionally minimal. This project targets a backend engineer role, so the
UI exists only to demonstrate that the backend works — not to be a polished product.

## Stack

- **Frontend**: Next.js (React, TypeScript) — thin demo layer
- **Auth + DB**: Supabase (PostgreSQL + Row Level Security)
- **Backend logic**: Supabase Edge Functions (Deno + TypeScript)
- **Payments**: Razorpay (test mode)
- **Cloud infra**: GCP — Cloud Run, Cloud Storage, BigQuery

## Pages (minimum, backend-first)

1. Login
2. Dashboard
3. Subscription page
4. Course list
5. Analytics page
6. Upload avatar
7. Admin page

## Build phases

- [ ] Phase 1 — Schema design (ER diagram + migrations)
- [ ] Phase 2 — Supabase project + Auth (email, Google, custom JWT claims)
- [ ] Phase 3 — Row Level Security policies (Free / Basic / Premium / Admin)
- [ ] Phase 4 — Edge Functions: create-order, verify-payment, upgrade-plan, cancel-plan, record-telemetry, ad-frequency
- [ ] Phase 5 — Telemetry → BigQuery export pipeline (Cloud Run job)
- [ ] Phase 6 — Cloud Storage (avatar/certificate uploads)
- [ ] Phase 7 — Query optimization pass (EXPLAIN ANALYZE, indexing, denormalization notes)
- [ ] Phase 8 — Frontend wiring, deploy, docs

## Repo structure

```
skillvault/
  apps/web/              → Next.js frontend
  supabase/
    migrations/           → SQL migration files
    functions/            → Edge Functions (Deno/TS)
  gcp/
    bigquery-export/      → Cloud Run job for telemetry export
  docs/
    architecture.md
    api-contract.md
    query-plans.md
```

See `/docs/architecture.md` for the full data flow and `/docs/api-contract.md` for endpoint contracts.
