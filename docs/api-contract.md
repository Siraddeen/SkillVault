# API Contract

Fill in as endpoints are built. Keep request/response shapes exact — this doubles as
documentation for the "API contracts with the mobile team" line in the target JD.

| Method | Path              | Auth required | Purpose                                  |
|--------|-------------------|----------------|-------------------------------------------|
| POST   | /login             | No             | Email/Google login via Supabase Auth      |
| POST   | /create-order      | Yes            | Create a Razorpay order for a plan        |
| POST   | /verify-payment    | Webhook secret | Razorpay webhook — confirm payment        |
| POST   | /upgrade-plan      | Yes / Admin    | Move user to a higher tier                |
| POST   | /cancel-plan       | Yes            | Downgrade user to Free                    |
| GET    | /profile           | Yes            | Current user + plan tier                  |
| GET    | /courses           | Yes            | Course list, filtered by tier via RLS     |
| POST   | /record-telemetry  | Yes            | Batch-insert usage events                 |
| GET    | /analytics         | Yes / Admin    | Aggregated telemetry from BigQuery         |
| POST   | /ad-frequency      | Yes            | Check/record an ad impression against cap |
| POST   | /upload-avatar     | Yes            | Upload to Cloud Storage                   |

Expand each row into full request/response JSON examples as you build the endpoint.
