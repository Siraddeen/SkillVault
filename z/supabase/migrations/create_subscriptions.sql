create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references plans(id),
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_subscriptions_active_user
  on subscriptions(user_id)
  where status = 'active';  -- enforce: only one active subscription per user at a time

create trigger trg_subscriptions_updated_at
  before update on subscriptions
  for each row
  execute function set_updated_at();  -- reusing the function from the orders migration

alter table subscriptions enable row level security;

create policy "Users can view own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);