-- Ad impressions: tracks each ad shown, used to enforce a daily cap for free-tier users
create table ad_impressions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  context text not null,          -- e.g. 'course-list', 'lesson-view'
  shown_at timestamptz not null default now()
);

create index idx_ad_impressions_user_shown_at on ad_impressions(user_id, shown_at);

alter table ad_impressions enable row level security;

-- Users can read their own impression history (useful for a future "why am I seeing this" debug view)
-- but cannot insert directly — only the ad-frequency function (service role) writes rows.
create policy "Users can view own ad impressions"
  on ad_impressions for select
  using (auth.uid() = user_id);

-- Telemetry events: generic event intake, must accept anon (pre-login) events too
create table telemetry_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,  -- nullable: anon events allowed
  event_type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_telemetry_events_type_created_at on telemetry_events(event_type, created_at);
create index idx_telemetry_events_user_id on telemetry_events(user_id);

alter table telemetry_events enable row level security;

-- No select/insert policies at all: telemetry is write-only from the client's perspective,
-- and reads are for internal analytics (BigQuery export later) via service_role, not end users.