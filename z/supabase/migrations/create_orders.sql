-- plans table: source of truth for pricing/tiers
create table plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name in ('free', 'basic', 'premium')),
  price integer not null,           -- in paise, 0 for free
  currency text not null default 'INR',
  features jsonb not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into plans (name, price, features) values
  ('free', 0, '{"courses": "limited", "ads": true}'),
  ('basic', 49900, '{"courses": "all", "ads": false}'),
  ('premium', 99900, '{"courses": "all", "ads": false, "certificates": true}');

-- orders table
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references plans(id),
  receipt text not null unique,
  amount integer not null,              -- paise, snapshotted at order time
  currency text not null default 'INR',
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  payment_metadata jsonb,                -- gateway response: method, bank, email, signature, etc.
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- auto-update updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_orders_updated_at
  before update on orders
  for each row
  execute function set_updated_at();

-- indexes
create index idx_orders_user_id on orders(user_id);
create index idx_orders_status on orders(status);
create index idx_orders_created_at on orders(created_at);

-- RLS
alter table orders enable row level security;
alter table plans enable row level security;

-- users: read-only, own rows only. No INSERT/UPDATE/DELETE policy —
-- all writes happen via Edge Functions using the service_role key.
create policy "Users can view own orders"
  on orders for select
  using (auth.uid() = user_id);

-- plans are public read (pricing page needs this, no auth required)
create policy "Anyone can view active plans"
  on plans for select
  using (is_active = true);