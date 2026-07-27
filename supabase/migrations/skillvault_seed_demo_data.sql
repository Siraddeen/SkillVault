-- =====================================================================
-- SkillVault — Realistic Demo Data Seed Script
-- =====================================================================
-- Run this in the Supabase SQL Editor (dev/staging project, not prod).
--
-- ASSUMPTIONS — verify these against your actual schema before running:
--   1. telemetry_events has a timestamp column called `created_at`.
--      If yours is named differently (e.g. occurred_at), find/replace it.
--   2. telemetry_events.payload is jsonb and stores course_id as
--      payload->>'course_id' for 'lesson_view' events (per your
--      query-plans.md fix).
--   3. profiles table has: id (FK -> auth.users), is_admin boolean.
--      If it has other NOT NULL columns, add defaults for them below.
--   4. subscriptions has: user_id, plan_id, status, starts_at, expires_at.
--   5. plans has a `name` column with values 'free' | 'basic' | 'premium'.
--
-- Tunable knobs:
--   TOTAL_DEMO_USERS   - pool of fake users
--   PREMIUM_COUNT      - how many get an active premium subscription
--   BASIC_COUNT        - how many get an active basic subscription
--   DAYS_BACK          - how many days of DAU/telemetry history to backfill
--   MIN_DAU / MAX_DAU  - daily active user range per day
-- =====================================================================

DO $$
DECLARE
  TOTAL_DEMO_USERS INT := 60;
  PREMIUM_COUNT     INT := 4;   -- fewer premium than basic: premium is the harder upsell
  BASIC_COUNT       INT := 12;  -- basic/premium of 12/4 => 25% premium share, more believable
  DAYS_BACK         INT := 14;
  MIN_DAU           INT := 22;
  MAX_DAU           INT := 45;

  demo_user_ids     UUID[];
  course_ids        UUID[];
  premium_plan_id   UUID;
  basic_plan_id     UUID;

  i                 INT;
  d                 INT;
  day_ts            TIMESTAMPTZ;
  active_today      INT;
  chosen_user        UUID;
  chosen_course       UUID;
  new_user_id       UUID;
  fake_email        TEXT;
BEGIN
  -- ---------------------------------------------------------------
  -- 0. Self-clean: wipe any previous run's demo rows first, so this
  --    script is safe to rerun as many times as you want without
  --    hitting the auth.users unique-email error.
  -- ---------------------------------------------------------------
  DELETE FROM public.telemetry_events WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE 'demo.user%@skillvault-demo.dev'
  );
  DELETE FROM public.subscriptions WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE 'demo.user%@skillvault-demo.dev'
  );
  DELETE FROM public.profiles WHERE id IN (
    SELECT id FROM auth.users WHERE email LIKE 'demo.user%@skillvault-demo.dev'
  );
  DELETE FROM auth.users WHERE email LIKE 'demo.user%@skillvault-demo.dev';

  -- ---------------------------------------------------------------
  -- 1. Create demo users in auth.users (+ matching profiles rows)
  -- ---------------------------------------------------------------
  FOR i IN 1..TOTAL_DEMO_USERS LOOP
    new_user_id := gen_random_uuid();
    fake_email := 'demo.user' || i || '@skillvault-demo.dev';

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id, 'authenticated', 'authenticated', fake_email,
      crypt('demo-password-not-real', gen_salt('bf')),
      now() - (random() * DAYS_BACK || ' days')::interval,
      now() - (random() * (DAYS_BACK + 10) || ' days')::interval,
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      '', '', '', ''
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, is_admin)
    VALUES (new_user_id, false)
    ON CONFLICT (id) DO NOTHING;

    demo_user_ids := array_append(demo_user_ids, new_user_id);
  END LOOP;

  -- ---------------------------------------------------------------
  -- 2. Pull existing course ids and build a TIER-WEIGHTED pool so
  --    free/beginner courses naturally get more views than gated
  --    ones — matches real top-of-funnel traffic, avoids the
  --    "every course gets ~100 views" flatness from the last run.
  --    Weight: free x5, basic x2, premium x1
  -- ---------------------------------------------------------------
  SELECT array_agg(id) INTO course_ids
  FROM (
    SELECT id FROM public.courses WHERE tier = 'free'
    UNION ALL
    SELECT id FROM public.courses WHERE tier = 'free'
    UNION ALL
    SELECT id FROM public.courses WHERE tier = 'free'
    UNION ALL
    SELECT id FROM public.courses WHERE tier = 'free'
    UNION ALL
    SELECT id FROM public.courses WHERE tier = 'free'
    UNION ALL
    SELECT id FROM public.courses WHERE tier = 'basic'
    UNION ALL
    SELECT id FROM public.courses WHERE tier = 'basic'
    UNION ALL
    SELECT id FROM public.courses WHERE tier = 'premium'
  ) weighted;

  IF course_ids IS NULL OR array_length(course_ids, 1) = 0 THEN
    RAISE EXCEPTION 'No rows in public.courses — seed courses first (or check your tier values match free/basic/premium).';
  END IF;

  -- ---------------------------------------------------------------
  -- 3. Look up plan ids
  -- ---------------------------------------------------------------
  SELECT id INTO premium_plan_id FROM public.plans WHERE name = 'premium' LIMIT 1;
  SELECT id INTO basic_plan_id   FROM public.plans WHERE name = 'basic'   LIMIT 1;

  -- ---------------------------------------------------------------
  -- 4. Assign active subscriptions (premium + basic)
  -- ---------------------------------------------------------------
  FOR i IN 1..PREMIUM_COUNT LOOP
    INSERT INTO public.subscriptions (user_id, plan_id, status, starts_at, expires_at)
    VALUES (
      demo_user_ids[i], premium_plan_id, 'active',
      now() - (random() * 30 || ' days')::interval,
      now() + (30 || ' days')::interval
    );
  END LOOP;

  FOR i IN (PREMIUM_COUNT + 1)..(PREMIUM_COUNT + BASIC_COUNT) LOOP
    INSERT INTO public.subscriptions (user_id, plan_id, status, starts_at, expires_at)
    VALUES (
      demo_user_ids[i], basic_plan_id, 'active',
      now() - (random() * 30 || ' days')::interval,
      now() + (30 || ' days')::interval
    );
  END LOOP;

  -- ---------------------------------------------------------------
  -- 4b. A few lapsed/cancelled subscriptions for realism — these
  --     don't count toward "active paid subscriptions" so they
  --     won't skew the conversion-rate number, but they stop the
  --     Admin panel's Subscription Status column from looking like
  --     100% of paying users are cleanly "active" forever.
  -- ---------------------------------------------------------------
  FOR i IN (PREMIUM_COUNT + BASIC_COUNT + 1)..(PREMIUM_COUNT + BASIC_COUNT + 3) LOOP
    INSERT INTO public.subscriptions (user_id, plan_id, status, starts_at, expires_at)
    VALUES (
      demo_user_ids[i], basic_plan_id, 'cancelled',
      now() - (30 + random() * 60 || ' days')::interval,
      now() - (random() * 20 || ' days')::interval
    );
  END LOOP;

  FOR i IN (PREMIUM_COUNT + BASIC_COUNT + 4)..(PREMIUM_COUNT + BASIC_COUNT + 5) LOOP
    INSERT INTO public.subscriptions (user_id, plan_id, status, starts_at, expires_at)
    VALUES (
      demo_user_ids[i], premium_plan_id, 'expired',
      now() - (60 + random() * 60 || ' days')::interval,
      now() - (random() * 15 || ' days')::interval
    );
  END LOOP;

  -- ---------------------------------------------------------------
  -- 5. Backfill telemetry (lesson_view events) day by day
  --    Gives you both DAU history and total view counts per course.
  -- ---------------------------------------------------------------
  FOR d IN 0..(DAYS_BACK - 1) LOOP
    day_ts := (now() - (d || ' days')::interval);
    active_today := MIN_DAU + floor(random() * (MAX_DAU - MIN_DAU + 1))::int;

    FOR i IN 1..active_today LOOP
      chosen_user := demo_user_ids[1 + floor(random() * TOTAL_DEMO_USERS)::int];
      chosen_course := course_ids[1 + floor(random() * array_length(course_ids, 1))::int];

      INSERT INTO public.telemetry_events (user_id, event_type, payload, created_at)
      VALUES (
        chosen_user,
        'lesson_view',
        jsonb_build_object('course_id', chosen_course),
        day_ts - (random() * interval '20 hours')
      );

      -- occasionally log a second view same day (repeat engagement),
      -- pushes total view count up toward a realistic ~140+ total
      IF random() < 0.35 THEN
        INSERT INTO public.telemetry_events (user_id, event_type, payload, created_at)
        VALUES (
          chosen_user,
          'lesson_view',
          jsonb_build_object('course_id', chosen_course),
          day_ts - (random() * interval '20 hours')
        );
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Seed complete: % demo users, % premium, % basic, % days of telemetry',
    TOTAL_DEMO_USERS, PREMIUM_COUNT, BASIC_COUNT, DAYS_BACK;
END $$;

-- =====================================================================
-- Quick sanity checks — run these after the block above finishes
-- =====================================================================
-- Total distinct users active in last 14 days:
-- SELECT count(DISTINCT user_id) FROM telemetry_events WHERE created_at > now() - interval '14 days';

-- Total lesson_view events:
-- SELECT count(*) FROM telemetry_events WHERE event_type = 'lesson_view';

-- Active subscriptions by plan:
-- SELECT p.name, count(*) FROM subscriptions s JOIN plans p ON p.id = s.plan_id
--   WHERE s.status = 'active' GROUP BY p.name;

-- =====================================================================
-- Manual full wipe (optional) — the script above already cleans up
-- after itself at the start of every run, so you do NOT need this
-- before rerunning the seed. Only use this if you want to remove all
-- demo data and NOT reseed.
-- =====================================================================
-- DELETE FROM telemetry_events WHERE user_id IN (
--   SELECT id FROM auth.users WHERE email LIKE 'demo.user%@skillvault-demo.dev'
-- );
-- DELETE FROM subscriptions WHERE user_id IN (
--   SELECT id FROM auth.users WHERE email LIKE 'demo.user%@skillvault-demo.dev'
-- );
-- DELETE FROM profiles WHERE id IN (
--   SELECT id FROM auth.users WHERE email LIKE 'demo.user%@skillvault-demo.dev'
-- );
-- DELETE FROM auth.users WHERE email LIKE 'demo.user%@skillvault-demo.dev';