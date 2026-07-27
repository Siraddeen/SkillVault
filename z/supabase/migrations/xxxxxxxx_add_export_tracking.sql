alter table telemetry_events
  add column if not exists exported_at timestamptz;

alter table ad_impressions
  add column if not exists exported_at timestamptz;

create index if not exists idx_telemetry_events_unexported
  on telemetry_events (created_at)
  where exported_at is null;

create index if not exists idx_ad_impressions_unexported
  on ad_impressions (shown_at)
  where exported_at is null;