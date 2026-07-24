alter table telemetry_events
  add column exported_at timestamptz;

alter table ad_impressions
  add column exported_at timestamptz;

create index idx_telemetry_events_unexported
  on telemetry_events (created_at)
  where exported_at is null;

create index idx_ad_impressions_unexported
  on ad_impressions (created_at)
  where exported_at is null;